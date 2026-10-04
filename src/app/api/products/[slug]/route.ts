import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
        category: true,
        brandRelation: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product });
  } catch (error) {
    console.error("[API /products/[slug]] Error:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
