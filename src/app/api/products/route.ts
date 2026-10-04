import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10)));
    const skip = (page - 1) * limit;

    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const brand = searchParams.get("brand") ?? "";
    const source = searchParams.get("source") ?? "";
    const size = searchParams.get("size") ?? "";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sort = searchParams.get("sort") ?? "recommended";
    const badge = searchParams.get("badge") ?? "";

    // Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      stock: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { description: { contains: q } },
        { fabric: { contains: q } },
        { pattern: { contains: q } },
        { fit: { contains: q } },
        { category: { name: { contains: q } } },
      ];
    }

    if (category) {
      where.category = { name: { equals: category } };
    }

    if (brand) {
      where.brand = { contains: brand };
    }

    if (source) {
      where.source = { equals: source };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {};
      if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
      if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
    }

    if (size) {
      where.variants = {
        some: {
          size: { equals: size },
          inStock: true,
        },
      };
    }

    if (badge === "best-deals") {
      where.isBestDeal = true;
    } else if (badge === "trending") {
      where.isTrending = true;
    } else if (badge === "featured") {
      where.isFeatured = true;
    }

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = [{ createdAt: "desc" }];
    if (sort === "price-asc") orderBy = [{ sellingPrice: "asc" }];
    else if (sort === "price-desc") orderBy = [{ sellingPrice: "desc" }];
    else if (sort === "newest") orderBy = [{ createdAt: "desc" }];
    else if (sort === "popular") orderBy = [{ reviewCount: "desc" }];
    else if (sort === "rating") orderBy = [{ rating: "desc" }];
    else if (sort === "recommended") orderBy = [{ isFeatured: "desc" }, { rating: "desc" }];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 2 },
          variants: { where: { inStock: true }, orderBy: { size: "asc" } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return Response.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + products.length < total,
      },
    });
  } catch (error) {
    console.error("[API /products] Error:", error);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
