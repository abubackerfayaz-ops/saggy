/**
 * scrape-fadon.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes ALL products from fadon.in's public Shopify JSON API and upserts
 * them into the Saggy database with a ₹400 markup on top of the source price.
 *
 * Run:  npx tsx prisma/scrape-fadon.ts
 *
 * Shopify JSON endpoints used:
 *   Products  → https://www.fadon.in/products.json?limit=250&page=N
 *   Images    → included in each product's "images" array
 *   Variants  → included in each product's "variants" array
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = "https://www.fadon.in";
const MARKUP = 150; // ₹150 added on top of source price (reduced from 400)
const PAGE_SIZE = 250; // Shopify max per page
const DELAY_MS = 500; // polite delay between requests
const SOURCE_NAME = "Fadon";

// ── Types ────────────────────────────────────────────────────────────────────
interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
  position: number;
  variant_ids: number[];
}

interface ShopifyVariant {
  id: number;
  title: string; // e.g. "S / Navy Blue"
  option1: string | null; // usually Size
  option2: string | null; // usually Color
  option3: string | null;
  price: string; // price in rupees as string, e.g. "799.00"
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
  inventory_quantity: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  published_at: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: { name: string; values: string[] }[];
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Strip HTML tags and decode basic HTML entities for clean text. */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract a metadata value from the description text by keyword. */
function extractMeta(description: string, keyword: string): string | null {
  const regex = new RegExp(`•?\\s*${keyword}[:\\s]+([^•\n]+)`, "i");
  const match = description.match(regex);
  return match ? match[1].trim().replace(/[•\n]/g, "").trim() : null;
}

/** Infer product category from tags, product_type, and title. */
function inferCategory(product: ShopifyProduct): string {
  const combined =
    `${product.title} ${product.product_type} ${product.tags.join(" ")}`.toLowerCase();

  if (combined.includes("shirt") && combined.includes("linen")) return "Linen";
  if (combined.includes("denim") || combined.includes("chambray")) return "Denim";
  if (
    combined.includes("oversized") ||
    combined.includes("baggy") ||
    combined.includes("drop shoulder")
  )
    return "Oversized";
  if (combined.includes("formal") || combined.includes("office")) return "Office Wear";
  if (
    combined.includes("printed") ||
    combined.includes("graphic") ||
    combined.includes("resort")
  )
    return "Printed";
  if (combined.includes("party") || combined.includes("satin")) return "Party Wear";
  if (combined.includes("tee") || combined.includes("t-shirt") || combined.includes("henley"))
    return "Tees";
  if (combined.includes("jacket") || combined.includes("bomber")) return "Jackets";
  if (combined.includes("trouser") || combined.includes("pant") || combined.includes("bottom"))
    return "Bottoms";
  if (combined.includes("accessories") || combined.includes("chain") || combined.includes("pendant"))
    return "Accessories";
  if (combined.includes("shirt")) return "Casual";
  return "Casual";
}

/** Derive fit from title/description */
function inferFit(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("oversized") || t.includes("boxy") || t.includes("drop shoulder"))
    return "Oversized";
  if (t.includes("slim")) return "Slim Fit";
  if (t.includes("relaxed")) return "Relaxed";
  if (t.includes("straight")) return "Straight Fit";
  if (t.includes("regular")) return "Regular Fit";
  return "Regular Fit";
}

/** Derive sleeve type from title/description */
function inferSleeve(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("full sleeve") || t.includes("full-sleeve") || t.includes("fullsleeve"))
    return "Full Sleeve";
  if (t.includes("half sleeve") || t.includes("short sleeve") || t.includes("tee") || t.includes("t-shirt"))
    return "Short Sleeve";
  if (t.includes("sleeveless")) return "Sleeveless";
  return "Full Sleeve";
}

/** Derive pattern type */
function inferPattern(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("check") || t.includes("plaid")) return "Checked";
  if (t.includes("strip")) return "Striped";
  if (t.includes("print") || t.includes("graphic") || t.includes("floral") || t.includes("tropical"))
    return "Printed";
  if (t.includes("acid wash") || t.includes("washed")) return "Washed";
  return "Solid";
}

/** Build a clean URL-safe slug from handle (Shopify already provides a good handle). */
function makeSlug(handle: string): string {
  return handle.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

/** Get the "source price" from variants — use the minimum price. */
function getSourcePrice(variants: ShopifyVariant[]): number {
  const prices = variants
    .map((v) => parseFloat(v.price))
    .filter((p) => !isNaN(p) && p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

// ── Fetch all products ───────────────────────────────────────────────────────
async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;

  console.log("📦 Fetching all products from fadon.in Shopify API...");

  while (true) {
    const url = `${BASE_URL}/products.json?limit=${PAGE_SIZE}&page=${page}`;
    console.log(`  → Page ${page}: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ✗ HTTP ${res.status} on page ${page}, stopping.`);
      break;
    }

    const data: ShopifyProductsResponse = await res.json();
    const products = data.products ?? [];

    if (products.length === 0) {
      console.log(`  → No more products on page ${page}. Done fetching.`);
      break;
    }

    allProducts.push(...products);
    console.log(`  ✓ Got ${products.length} products (total so far: ${allProducts.length})`);

    if (products.length < PAGE_SIZE) {
      // Last page
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  return allProducts;
}

// ── Ensure category and brand exist, return their IDs ───────────────────────
const categoryCache = new Map<string, string>();
const brandCache = new Map<string, string>();

async function ensureCategory(name: string): Promise<string> {
  if (categoryCache.has(name)) return categoryCache.get(name)!;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const cat = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  categoryCache.set(name, cat.id);
  return cat.id;
}

async function ensureBrand(name: string): Promise<string> {
  if (brandCache.has(name)) return brandCache.get(name)!;
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const brand = await prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  brandCache.set(name, brand.id);
  return brand.id;
}

// ── Upsert a single product ──────────────────────────────────────────────────
async function upsertProduct(shopifyProduct: ShopifyProduct): Promise<void> {
  const slug = makeSlug(shopifyProduct.handle);
  const rawDescription = stripHtml(shopifyProduct.body_html || "");
  const titleAndDesc = `${shopifyProduct.title} ${rawDescription}`;

  const sourcePrice = getSourcePrice(shopifyProduct.variants);
  if (sourcePrice <= 0) {
    console.warn(`  ⚠ Skipping "${shopifyProduct.title}" — price is 0 or missing`);
    return;
  }

  const sellingPrice = sourcePrice + MARKUP;
  const categoryName = inferCategory(shopifyProduct);
  const brandName = shopifyProduct.vendor || "Fadon";

  const [categoryId, brandId] = await Promise.all([
    ensureCategory(categoryName),
    ensureBrand(brandName),
  ]);

  // Extract metadata
  const fabric = extractMeta(rawDescription, "Fabric") ?? null;
  const fit = extractMeta(rawDescription, "Fit") ?? inferFit(titleAndDesc);
  const sleeve = inferSleeve(titleAndDesc);
  const pattern = inferPattern(titleAndDesc);
  const sourceUrl = `${BASE_URL}/products/${shopifyProduct.handle}`;

  // Upsert the product record
  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      name: shopifyProduct.title,
      brand: brandName,
      categoryId,
      brandId,
      description: rawDescription || null,
      sourcePrice,
      markup: MARKUP,
      sellingPrice,
      fit,
      fabric,
      pattern,
      sleeve,
      sourceUrl,
      stock: shopifyProduct.variants.some((v) => v.available),
      isActive: true,
      source: SOURCE_NAME,
      sourceProductId: String(shopifyProduct.id),
    },
    create: {
      slug,
      name: shopifyProduct.title,
      brand: brandName,
      categoryId,
      brandId,
      description: rawDescription || null,
      sourcePrice,
      markup: MARKUP,
      sellingPrice,
      fit,
      fabric,
      pattern,
      sleeve,
      sourceUrl,
      stock: shopifyProduct.variants.some((v) => v.available),
      isActive: true,
      source: SOURCE_NAME,
      sourceProductId: String(shopifyProduct.id),
    },
  });

  // ── Images ──────────────────────────────────────────────────────────────
  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  const sortedImages = [...shopifyProduct.images].sort((a, b) => a.position - b.position);
  for (let i = 0; i < sortedImages.length; i++) {
    const img = sortedImages[i];
    // Use full-resolution CDN URL (strip query params first)
    const cleanSrc = img.src.split("?")[0];
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: cleanSrc,
        altText: img.alt || `${shopifyProduct.title} - View ${i + 1}`,
        isPrimary: i === 0,
        sortOrder: i,
      },
    });
  }

  // ── Variants ────────────────────────────────────────────────────────────
  await prisma.productVariant.deleteMany({ where: { productId: product.id } });

  const seenCombos = new Set<string>();
  for (const variant of shopifyProduct.variants) {
    const colorOptionIndex = shopifyProduct.options.findIndex((o) =>
      ["color", "colour"].includes(o.name.toLowerCase())
    );
    const sizeOptionIndex = shopifyProduct.options.findIndex((o) =>
      ["size", "sizes"].includes(o.name.toLowerCase())
    );

    const sizeKey = (["option1", "option2", "option3"] as const)[
      sizeOptionIndex >= 0 ? sizeOptionIndex : 0
    ];
    const colorKey = (["option1", "option2", "option3"] as const)[
      colorOptionIndex >= 0 ? colorOptionIndex : 1
    ];

    const size = variant[sizeKey] || variant.option1 || "One Size";
    const color = (colorOptionIndex >= 0 ? variant[colorKey] : null) || null;
    const comboKey = `${size}|${color}`;

    if (seenCombos.has(comboKey)) continue;
    seenCombos.add(comboKey);

    try {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          size,
          color,
          sku: variant.sku || null,
          stock: Math.max(variant.inventory_quantity ?? 10, 0),
          inStock: variant.available,
        },
      });
    } catch {
      // Ignore duplicate unique constraint errors (size+color combo already exists)
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Fadon.in → Saggy scraper starting...");
  console.log(`   Markup: ₹${MARKUP} added to every source price\n`);

  const products = await fetchAllProducts();

  if (products.length === 0) {
    console.error("❌ No products fetched. Exiting.");
    process.exit(1);
  }

  console.log(`\n✅ Fetched ${products.length} products total. Importing to database...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(
      `[${i + 1}/${products.length}] ${p.title.substring(0, 60).padEnd(60)} `
    );

    try {
      await upsertProduct(p);
      process.stdout.write("✓\n");
      successCount++;
    } catch (err) {
      process.stdout.write("✗\n");
      console.error(`  Error: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("🏁 Fadon Scraper Completed!");
  console.log(`   ✅ Successfully imported : ${successCount} products`);
  console.log(`   ❌ Errors               : ${errorCount} products`);
  console.log(`   💰 Markup applied       : ₹${MARKUP} per product`);
  console.log("══════════════════════════════════════════════════════\n");

  // Show a sample of prices
  const sampleProducts = await prisma.product.findMany({
    where: { source: SOURCE_NAME },
    take: 5,
    select: { name: true, sourcePrice: true, markup: true, sellingPrice: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("Sample imported products (latest 5):");
  console.log("─────────────────────────────────────────────────────────────────────");
  console.log("Name".padEnd(50) + "Source Price".padEnd(15) + "Markup".padEnd(10) + "Selling Price");
  console.log("─────────────────────────────────────────────────────────────────────");
  for (const p of sampleProducts) {
    console.log(
      p.name.substring(0, 48).padEnd(50) +
        `₹${p.sourcePrice}`.padEnd(15) +
        `₹${p.markup}`.padEnd(10) +
        `₹${p.sellingPrice}`
    );
  }
  console.log("─────────────────────────────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
