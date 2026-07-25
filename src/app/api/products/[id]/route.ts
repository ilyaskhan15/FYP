import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: true,
        reviews: {
          where: { status: 'approved' },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get related products
    const related = await db.product.findMany({
      where: {
        id: { not: id },
        isActive: true,
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      take: 8,
      orderBy: { soldCount: 'desc' },
      select: { id: true, name: true, slug: true, price: true, compareAtPrice: true, images: true, rating: true, reviewCount: true, brand: true },
    })

    return NextResponse.json({ product, related })
  } catch (error) {
    console.error('Product detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}