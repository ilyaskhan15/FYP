import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/wishlist — Return user's wishlist items with product details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const wishlistItems = await db.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            rating: true,
            reviewCount: true,
            stock: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items = wishlistItems.map((item) => {
      const images: string[] = JSON.parse(item.product.images)
      return {
        id: item.id,
        productId: item.productId,
        addedAt: item.createdAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          rating: item.product.rating,
          reviewCount: item.product.reviewCount,
          stock: item.product.stock,
          image: images.length > 0 ? images[0] : null,
        },
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Wishlist GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

// POST /api/wishlist — Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check for duplicate
    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Product already in wishlist' }, { status: 409 })
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const item = await db.wishlist.create({
      data: { userId, productId },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Wishlist POST error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

// DELETE /api/wishlist — Remove product from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item not found in wishlist' }, { status: 404 })
    }

    await db.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}