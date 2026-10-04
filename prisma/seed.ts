import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. System Settings
  await prisma.setting.upsert({
    where: { key: "default_markup" },
    update: { value: "400" },
    create: {
      key: "default_markup",
      value: "400",
      description: "Default platform sourcing markup in INR",
    },
  });

  await prisma.setting.upsert({
    where: { key: "shipping_fee" },
    update: { value: "49" },
    create: {
      key: "shipping_fee",
      value: "49",
      description: "Standard shipping fee in INR",
    },
  });

  // 2. Default Price Rule
  await prisma.priceRule.upsert({
    where: { id: "default-rule" },
    update: {},
    create: {
      id: "default-rule",
      name: "Standard ₹400 Markup",
      markupAmount: 400,
      isDefault: true,
      isActive: true,
    },
  });

  // 3. Admin User
  await prisma.user.upsert({
    where: { email: "admin@saggy.in" },
    update: {},
    create: {
      email: "admin@saggy.in",
      name: "Saggy Store Admin",
      role: "ADMIN",
      phone: "+91 9876543210",
    },
  });

  // 4. Categories
  const categoriesData = [
    { name: "Casual", slug: "casual", description: "Everyday versatile button-downs and relaxed shirts." },
    { name: "Formal", slug: "formal", description: "Crisp boardroom shirts with tailored fits." },
    { name: "Oversized", slug: "oversized", description: "Modern drop-shoulder street fits." },
    { name: "Linen", slug: "linen", description: "Breathable pure linen and linen-cotton blends." },
    { name: "Denim", slug: "denim", description: "Rugged washed denim and chambray shirts." },
    { name: "Printed", slug: "printed", description: "Statement resort prints and vacation collars." },
    { name: "Party Wear", slug: "party-wear", description: "Sleek satin and evening dark shirts." },
    { name: "Office Wear", slug: "office-wear", description: "Smart casual & executive essentials." },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.name, created.id);
  }

  // 5. Brands
  const brandsData = [
    { name: "Dennis Lingo", slug: "dennis-lingo" },
    { name: "Roadster", slug: "roadster" },
    { name: "Highlander", slug: "highlander" },
    { name: "Snitch", slug: "snitch" },
    { name: "The Souled Store", slug: "the-souled-store" },
    { name: "Mast & Harbour", slug: "mast-and-harbour" },
    { name: "Here&Now", slug: "here-and-now" },
  ];

  const brandMap = new Map<string, string>();
  for (const b of brandsData) {
    const created = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
    brandMap.set(b.name, created.id);
  }

  // 6. Curated Shirt Products (Strictly adhering to SELLING PRICE = SOURCE PRICE + 400)
  const shirtsData = [
    {
      slug: "dennis-lingo-premium-mandarin-casual-shirt",
      name: "Premium Mandarin Collar Casual Shirt",
      brand: "Dennis Lingo",
      category: "Casual",
      source: "AJIO",
      sourceProductId: "AJIO-46123",
      sourcePrice: 499,
      markup: 400,
      sellingPrice: 899,
      description: "Crafted from 100% premium combed cotton with a streamlined mandarin band collar. Breathable, durable, and effortlessly pairs with chinos or jeans.",
      fit: "Slim Fit",
      fabric: "100% Cotton",
      pattern: "Solid",
      sleeve: "Full Sleeve",
      rating: 4.6,
      reviewCount: 142,
      isFeatured: true,
      isTrending: true,
      isBestDeal: true,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Olive Green", "Navy Blue", "White"],
    },
    {
      slug: "snitch-boxy-drop-shoulder-oversized-shirt",
      name: "Boxy Drop-Shoulder Oversized Linen Shirt",
      brand: "Snitch",
      category: "Oversized",
      source: "Myntra",
      sourceProductId: "MYN-98421",
      sourcePrice: 699,
      markup: 400,
      sellingPrice: 1099,
      description: "High-street relaxed silhouette with relaxed dropped shoulders and Cuban camp collar. Designed for modern aesthetic streetwear.",
      fit: "Oversized Fit",
      fabric: "Linen-Rayon Blend",
      pattern: "Solid",
      sleeve: "Half Sleeve",
      rating: 4.8,
      reviewCount: 98,
      isFeatured: true,
      isTrending: true,
      isBestDeal: false,
      images: [
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Beige Sand", "Onyx Black", "Sage"],
    },
    {
      slug: "highlander-classic-oxford-formal-shirt",
      name: "Classic Tailored Oxford Formal Shirt",
      brand: "Highlander",
      category: "Formal",
      source: "AJIO",
      sourceProductId: "AJIO-87112",
      sourcePrice: 549,
      markup: 400,
      sellingPrice: 949,
      description: "A business wardrobe staple with reinforced point collar and wrinkle-resistant basket-weave oxford fabric. Polished, sharp, and easy to iron.",
      fit: "Regular Fit",
      fabric: "100% Oxford Cotton",
      pattern: "Solid",
      sleeve: "Full Sleeve",
      rating: 4.5,
      reviewCount: 230,
      isFeatured: true,
      isTrending: false,
      isBestDeal: true,
      images: [
        "https://images.unsplash.com/photo-1620012253295-c15c429f66bf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Sky Blue", "Pure White", "Charcoal"],
    },
    {
      slug: "the-souled-store-vacation-camp-printed-shirt",
      name: "Tropical Palms Vacation Camp Shirt",
      brand: "The Souled Store",
      category: "Printed",
      source: "BrandFeed",
      sourceProductId: "TSS-33019",
      sourcePrice: 599,
      markup: 400,
      sellingPrice: 999,
      description: "Ultra-soft micro-modal vacation shirt engineered for summer escapes and weekend outings. Vibrant non-fade botanical print with notch collar.",
      fit: "Relaxed Fit",
      fabric: "Viscose Rayon",
      pattern: "Printed",
      sleeve: "Half Sleeve",
      rating: 4.7,
      reviewCount: 76,
      isFeatured: false,
      isTrending: true,
      isBestDeal: false,
      images: [
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Emerald Palms", "Sunset Rust"],
    },
    {
      slug: "roadster-washed-indigo-denim-shirt",
      name: "Rugged Heavy Washed Indigo Denim Shirt",
      brand: "Roadster",
      category: "Denim",
      source: "Myntra",
      sourceProductId: "MYN-44219",
      sourcePrice: 799,
      markup: 400,
      sellingPrice: 1199,
      description: "Authentic twill denim with stonewashed distress highlights and western snap-button dual chest pockets. Timeless durability.",
      fit: "Regular Fit",
      fabric: "100% Cotton Denim",
      pattern: "Solid Washed",
      sleeve: "Full Sleeve",
      rating: 4.6,
      reviewCount: 310,
      isFeatured: true,
      isTrending: false,
      isBestDeal: false,
      images: [
        "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Medium Indigo", "Acid Wash Light Blue"],
    },
    {
      slug: "mast-and-harbour-pure-linen-resort-shirt",
      name: "Pure European Flax Breathable Linen Shirt",
      brand: "Mast & Harbour",
      category: "Linen",
      source: "AJIO",
      sourceProductId: "AJIO-72910",
      sourcePrice: 999,
      markup: 400,
      sellingPrice: 1399,
      description: "Naturally textured pure European flax linen that gets softer with every wash. Thermo-regulating fabric keeping you fresh throughout warm days.",
      fit: "Regular Fit",
      fabric: "100% Pure Linen",
      pattern: "Solid",
      sleeve: "Full Sleeve",
      rating: 4.9,
      reviewCount: 88,
      isFeatured: true,
      isTrending: true,
      isBestDeal: false,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      ],
      colors: ["Natural Ecru", "Olive Drab", "Powder Blue"],
    },
  ];

  for (const item of shirtsData) {
    const categoryId = categoryMap.get(item.category);
    const brandId = brandMap.get(item.brand);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        brand: item.brand,
        categoryId: categoryId,
        brandId: brandId,
        source: item.source,
        sourceProductId: item.sourceProductId,
        sourcePrice: item.sourcePrice,
        markup: item.markup,
        sellingPrice: item.sellingPrice,
        description: item.description,
        fit: item.fit,
        fabric: item.fabric,
        pattern: item.pattern,
        sleeve: item.sleeve,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isFeatured: item.isFeatured,
        isTrending: item.isTrending,
        isBestDeal: item.isBestDeal,
      },
      create: {
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        categoryId: categoryId,
        brandId: brandId,
        source: item.source,
        sourceProductId: item.sourceProductId,
        sourcePrice: item.sourcePrice,
        markup: item.markup,
        sellingPrice: item.sellingPrice,
        description: item.description,
        fit: item.fit,
        fabric: item.fabric,
        pattern: item.pattern,
        sleeve: item.sleeve,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isFeatured: item.isFeatured,
        isTrending: item.isTrending,
        isBestDeal: item.isBestDeal,
      },
    });

    // Images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < item.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.images[i],
          altText: `${item.name} - View ${i + 1}`,
          isPrimary: i === 0,
          sortOrder: i,
        },
      });
    }

    // Sizes variants: S, M, L, XL, XXL
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    const sizes = ["S", "M", "L", "XL", "XXL"];
    for (const size of sizes) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          size: size,
          color: item.colors[0],
          sku: `${product.slug}-${size}`.toUpperCase(),
          stock: 15,
          inStock: true,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully! Products, categories, and brands created.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
