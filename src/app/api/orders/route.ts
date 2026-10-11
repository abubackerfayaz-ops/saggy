import type { NextRequest } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import {
  calcShipping,
  validateDetails,
  type CheckoutDetails,
  type OrderPayload,
  type PlacedOrder,
} from "@/lib/checkout";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_ITEMS = 20;
const MAX_QTY = 10;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 500) {
      for (const [key, value] of rateBuckets) {
        if (value.resetAt <= now) rateBuckets.delete(key);
      }
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function generateOrderNumber(): string {
  return "SGY-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

interface ResolvedItem {
  productId: string;
  variantId: string | null;
  productName: string;
  brandName: string;
  size: string;
  quantity: number;
  sourcePrice: number;
  markup: number;
  sellingPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) return bad("Request too large", 413);

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return bad("Request too large", 413);

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return bad("Too many order attempts from this device. Please try again later.", 429);
    }

    let body: Partial<OrderPayload>;
    try {
      body = JSON.parse(raw) as Partial<OrderPayload>;
    } catch {
      return bad("Invalid request body");
    }

    const customer = body.customer;
    const address = body.address;
    const items = body.items;
    if (!customer || !address || !Array.isArray(items) || items.length === 0) {
      return bad("Missing customer details or bag items");
    }
    if (items.length > MAX_ITEMS) return bad("Too many items in one order");

    const details: CheckoutDetails = {
      name: typeof customer.name === "string" ? customer.name : "",
      phone: typeof customer.phone === "string" ? customer.phone : "",
      email: typeof customer.email === "string" ? customer.email : "",
      line1: typeof address.line1 === "string" ? address.line1 : "",
      line2: typeof address.line2 === "string" ? address.line2 : "",
      city: typeof address.city === "string" ? address.city : "",
      state: typeof address.state === "string" ? address.state : "",
      pinCode: typeof address.pinCode === "string" ? address.pinCode : "",
    };

    const detailErrors = validateDetails(details);
    const firstError = Object.values(detailErrors).find((e) => e);
    if (firstError) return bad(firstError);

    const normalizedItems: { productId: string; variantId?: string; size: string; color?: string | null; quantity: number }[] = [];
    for (const item of items) {
      if (!item || typeof item.productId !== "string" || typeof item.size !== "string") {
        return bad("Invalid item in bag");
      }
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
        return bad("Invalid quantity for one of the items");
      }
      if (item.variantId !== undefined && typeof item.variantId !== "string") {
        return bad("Invalid item in bag");
      }
      normalizedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        size: item.size,
        color: typeof item.color === "string" ? item.color : null,
        quantity,
      });
    }

    const productIds = [...new Set(normalizedItems.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        variants: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const resolved: ResolvedItem[] = [];
    for (const item of normalizedItems) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return bad("One of the items in your bag is no longer available. Please refresh the page.");
      }

      let variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : undefined;

      if (!variant) {
        const sameSize = product.variants.filter((v) => v.size === item.size);
        variant = item.color
          ? sameSize.find((v) => (v.color ?? "").toLowerCase() === item.color!.toLowerCase()) ??
            sameSize.find((v) => !v.color)
          : sameSize.find((v) => !v.color) ?? sameSize[0];
      }

      if (!variant) {
        return bad(`Size ${item.size} of ${product.name} is not available.`);
      }
      if (!variant.inStock) {
        return bad(`Size ${item.size} of ${product.name} is out of stock.`);
      }
      if (variant.stock > 0 && variant.stock < item.quantity) {
        return bad(
          `Only ${variant.stock} left for size ${item.size} of ${product.name}. Please reduce the quantity.`
        );
      }

      resolved.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        brandName: product.brand,
        size: variant.size,
        quantity: item.quantity,
        sourcePrice: product.sourcePrice,
        markup: product.markup,
        sellingPrice: product.sellingPrice,
        totalPrice: product.sellingPrice * item.quantity,
        imageUrl: product.images[0]?.url ?? null,
      });
    }

    const subtotal = resolved.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingFee = calcShipping(subtotal);
    const total = subtotal + shippingFee;
    const itemCount = resolved.reduce((sum, i) => sum + i.quantity, 0);

    let order: PlacedOrder | null = null;

    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      const orderNumber = generateOrderNumber();
      try {
        const created = await prisma.$transaction(async (tx) => {
          const addressRow = await tx.address.create({
            data: {
              fullName: details.name,
              phone: details.phone,
              email: details.email || null,
              addressLine1: details.line1,
              addressLine2: details.line2 || null,
              city: details.city,
              state: details.state,
              pinCode: details.pinCode,
            },
          });

          for (const item of resolved) {
            if (!item.variantId) continue;
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (!variant) continue;
            if (variant.stock > 0) {
              const nextStock = Math.max(0, variant.stock - item.quantity);
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stock: nextStock, inStock: nextStock > 0 },
              });
            }
          }

          const affected = new Set(resolved.map((i) => i.productId));
          for (const productId of affected) {
            const variants = await tx.productVariant.findMany({ where: { productId } });
            await tx.product.update({
              where: { id: productId },
              data: {
                stockQuantity: variants.reduce((sum, v) => sum + Math.max(v.stock, 0), 0),
                stock: variants.some((v) => v.inStock),
              },
            });
          }

          return tx.order.create({
            data: {
              orderNumber,
              guestName: details.name,
              guestEmail: details.email || null,
              guestPhone: details.phone,
              shippingAddressId: addressRow.id,
              status: "PENDING",
              paymentStatus: "PENDING",
              paymentMethod: "UPI",
              subtotal,
              shippingFee,
              discount: 0,
              total,
              items: {
                create: resolved.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  productName: item.productName,
                  brandName: item.brandName,
                  size: item.size,
                  quantity: item.quantity,
                  sourcePrice: item.sourcePrice,
                  markup: item.markup,
                  sellingPrice: item.sellingPrice,
                  totalPrice: item.totalPrice,
                  imageUrl: item.imageUrl,
                })),
              },
            },
          });
        });

        order = {
          orderNumber: created.orderNumber,
          subtotal: created.subtotal,
          shippingFee: created.shippingFee,
          total: created.total,
          itemCount,
          createdAt: created.createdAt.toISOString(),
        };
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002" && attempt < 2) continue;
        throw error;
      }
    }

    if (!order) return bad("Could not allocate an order number. Please try again.", 500);

    return Response.json({ ok: true, order }, { status: 201 });
  } catch (error) {
    console.error("[API /orders] Error:", error);
    return bad("Something went wrong while placing your order. Please try again.", 500);
  }
}
