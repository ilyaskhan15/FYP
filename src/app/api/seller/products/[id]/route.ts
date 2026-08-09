import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Helper: verify the product belongs to the seller identified by userId
async function verifyOwnership(
  productId: string,
  userId: string
) {
  const seller = await db.sellerProfile.findUnique({ where: { userId } })
  if (!seller) return null

  const product = await db.product.findFirst({
    where: { id: productId, sellerId: seller.id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  })

  return product
}

// GET /api/seller/products/[id]?userId=xxx — get a single seller product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const product = await verifyOwnership(id, userId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Seller product GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/seller/products/[id]?userId=xxx — update a seller product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      compareAtPrice,
      stock,
      brand,
      categoryId,
      isFeatured,
      isNew,
      tags,
      sku,
      images,
    } = body

    // Verify ownership
    const existing = await verifyOwnership(id, userId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }
    if (price !== undefined && (price === null || price < 0)) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Regenerate slug if name changed
    let slug = existing.slug
    if (name && name.trim() !== existing.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Check slug uniqueness (excluding current product)
      const slugConflict = await db.product.findFirst({
        where: { slug, id: { not: id } },
      })
      if (slugConflict) {
        return NextResponse.json(
          { error: 'A product with a similar name already exists' },
          { status: 409 }
        )
      }
    }

    // Parse images
    let parsedImages: string[] = []
    if (images !== undefined) {
      if (typeof images === 'string') {
        parsedImages = images
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0)
      } else if (Array.isArray(images)) {
        parsedImages = images
      }
    }

    // Build update data with only provided fields
    const data: Record<string, unknown> = { slug }
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description?.trim() || null
    if (price !== undefined) data.price = parseFloat(price)
    if (compareAtPrice !== undefined)
      data.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null
    if (stock !== undefined) data.stock = parseInt(stock) || 0
    if (brand !== undefined) data.brand = brand?.trim() || null
    if (categoryId !== undefined) data.categoryId = categoryId || null
    if (isFeatured !== undefined) data.isFeatured = !!isFeatured
    if (isNew !== undefined) data.isNew = !!isNew
    if (tags !== undefined) data.tags = tags?.trim() || null
    if (sku !== undefined) data.sku = sku?.trim() || null
    if (images !== undefined) data.images = JSON.stringify(parsedImages)

    const product = await db.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Seller product PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/seller/products/[id]?userId=xxx — permanently delete a seller product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(_request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await verifyOwnership(id, userId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Permanently delete the product.
    // ProductVariant, Wishlist, Cart, Review rows are cascade-deleted via schema.
    // OrderItem rows have productId set to null (onDelete: SetNull) — order history preserved.
    await db.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seller product DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
