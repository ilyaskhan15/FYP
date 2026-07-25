import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/admin/products/[id] — update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isActive,
      tags,
      sku,
      images,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }
    if (price === undefined || price === null || price < 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Check product exists
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Regenerate slug from name
    const slug = name
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

    // Parse images
    let parsedImages: string[] = []
    if (images && typeof images === 'string') {
      parsedImages = images
        .split(',')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0)
    } else if (Array.isArray(images)) {
      parsedImages = images
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        stock: parseInt(stock) || 0,
        brand: brand?.trim() || null,
        categoryId,
        isFeatured: !!isFeatured,
        isNew: !!isNew,
        isActive: isActive !== false,
        tags: tags?.trim() || null,
        sku: sku?.trim() || null,
        images: JSON.stringify(parsedImages),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Admin products PUT error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] — delete a product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin products DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}