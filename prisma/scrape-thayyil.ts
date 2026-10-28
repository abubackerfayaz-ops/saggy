/**
 * scrape-thayyil.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes ALL jerseys from thayyilsports.in's public Shopify JSON API and
 * upserts them into the Saggy database with a ₹100 markup on top of the
 * source price (site price = source price + ₹100).
 *
 * Run:  npx tsx prisma/scrape-thayyil.ts
 *
 * Shopify JSON endpoints used:
 *   Products  → https://www.thayyilsports.in/products.json?limit=250&page=N
 *   Images    → included in each product's "images" array
 *   Variants  → included in each product's "variants" array (sizes)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = "https://www.thayyilsports.in";
const MARKUP = 100; // ₹100 added on top of source price
const PAGE_SIZE = 250; // Shopify max per page
const DELAY_MS = 500; // polite delay between requests
const SOURCE_NAME = "Thayyil Sports";
const CATEGORY_NAME = "Jerseys";

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
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
  inventory_quantity?: number;
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
    .replace(/[^\x20-\x7E\u00A0-\u024F\n]/g, "") // drop stray replacement chars
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferFit(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("oversized") || t.includes("boxy") || t.includes("drop shoulder")) return "Oversized";
  if (t.includes("slim")) return "Slim Fit";
  if (t.includes("relaxed")) return "Relaxed";
  if (t.includes("regular")) return "Regular Fit";
  return "Regular Fit";
}

function inferSleeve(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("full sleeve") || t.includes("full-sleeve") || t.includes("fullsleeve"))
    return "Full Sleeve";
  if (t.includes("sleeveless")) return "Sleeveless";
  return "Short Sleeve";
}

function inferPattern(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("stripe") || t.includes("striped")) return "Striped";
  if (t.includes("check") || t.includes("plaid")) return "Checked";
  if (t.includes("print") || t.includes("graphic")) return "Printed";
  return "Solid";
}

function makeSlug(handle: string): string {
  return handle.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

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

  console.log("📦 Fetching all jerseys from thayyilsports.in Shopify API...");

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

    if (products.length === 0) break;

    allProducts.push(...products);
    console.log(`  ✓ Got ${products.length} products (total so far: ${allProducts.length})`);

    if (products.length < PAGE_SIZE) break;

    page++;
    await sleep(DELAY_MS);
  }

  return allProducts;
}

// ── Ensure category and brand exist ──────────────────────────────────────────
async function ensureCategory(name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const cat = await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  return cat.id;
}

async function ensureBrand(name: string): Promise<string> {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const brand = await prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });
  return brand.id;
}

// ── Upsert a single product ──────────────────────────────────────────────────
async function upsertProduct(
  shopifyProduct: ShopifyProduct,
  categoryId: string
): Promise<"created" | "updated" | "skipped"> {
  const rawDescription = stripHtml(shopifyProduct.body_html || "");
  const description = rawDescription.length > 2 ? rawDescription : null;
  const titleAndDesc = `${shopifyProduct.title} ${shopifyProduct.tags.join(" ")} ${rawDescription}`;

  const sourcePrice = getSourcePrice(shopifyProduct.variants);
  if (sourcePrice <= 0) {
    console.warn(`  ⚠ Skipping "${shopifyProduct.title}" — price is 0 or missing`);
    return "skipped";
  }

  const sellingPrice = sourcePrice + MARKUP;
  const brandName = shopifyProduct.vendor || SOURCE_NAME;

  // Never clobber a product that came from another source under the same handle
  let slug = makeSlug(shopifyProduct.handle);
  const existing = await prisma.product.findUnique({ where: { slug }, select: { source: true } });
  if (existing && existing.source !== SOURCE_NAME) slug = `${slug}-ts`;

  const brandId = await ensureBrand(brandName);
  const sourceUrl = `${BASE_URL}/products/${shopifyProduct.handle}`;

  const data = {
    name: shopifyProduct.title,
    brand: brandName,
    categoryId,
    brandId,
    description,
    sourcePrice,
    markup: MARKUP,
    sellingPrice,
    fit: inferFit(titleAndDesc),
    fabric: null,
    pattern: inferPattern(titleAndDesc),
    sleeve: inferSleeve(titleAndDesc),
    sourceUrl,
    stock: shopifyProduct.variants.some((v) => v.available),
    isActive: true,
    source: SOURCE_NAME,
    sourceProductId: String(shopifyProduct.id),
  };

  const product = await prisma.product.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });

  // ── Images ──────────────────────────────────────────────────────────────
  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  const sortedImages = [...shopifyProduct.images].sort((a, b) => a.position - b.position);
  for (let i = 0; i < sortedImages.length; i++) {
    const img = sortedImages[i];
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: img.src.split("?")[0],
        altText: img.alt || `${shopifyProduct.title} - View ${i + 1}`,
        isPrimary: i === 0,
        sortOrder: i,
      },
    });
  }

  // ── Variants (sizes) ────────────────────────────────────────────────────
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
      // ignore duplicate size+color combos
    }
  }

  return existing ? "updated" : "created";
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Thayyil Sports → Saggy jersey scraper starting...");
  console.log(`   Markup: ₹${MARKUP} added to every source price\n`);

  const products = await fetchAllProducts();

  if (products.length === 0) {
    console.error("❌ No products fetched. Exiting.");
    process.exit(1);
  }

  console.log(`\n✅ Fetched ${products.length} jerseys total. Importing to database...\n`);

  const categoryId = await ensureCategory(CATEGORY_NAME);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.title.substring(0, 60).padEnd(60)} `);

    try {
      const result = await upsertProduct(p, categoryId);
      process.stdout.write(`✓ ${result}\n`);
      if (result === "created") created++;
      else if (result === "updated") updated++;
      else skipped++;
    } catch (err) {
      process.stdout.write("✗\n");
      console.error(`  Error: ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("🏁 Thayyil Sports Scraper Completed!");
  console.log(`   ✅ Created : ${created} jerseys`);
  console.log(`   ♻️  Updated : ${updated} jerseys`);
  console.log(`   ⚠️  Skipped : ${skipped}`);
  console.log(`   ❌ Errors  : ${errors}`);
  console.log(`   💰 Markup  : ₹${MARKUP} per jersey`);
  console.log("══════════════════════════════════════════════════════\n");

  const sample = await prisma.product.findMany({
    where: { source: SOURCE_NAME },
    take: 5,
    select: { name: true, sourcePrice: true, markup: true, sellingPrice: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("Sample imported jerseys (latest 5):");
  console.log("─────────────────────────────────────────────────────────────────────");
  console.log("Name".padEnd(50) + "Source Price".padEnd(15) + "Markup".padEnd(10) + "Selling Price");
  console.log("─────────────────────────────────────────────────────────────────────");
  for (const p of sample) {
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
