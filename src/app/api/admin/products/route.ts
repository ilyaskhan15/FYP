import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/products — list all products (including inactive) with search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin products GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/admin/products — create a new product
export async function POST(request: NextRequest) {
  try {
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

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Check for slug uniqueness
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) {
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

    const product = await db.product.create({
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

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Admin products POST error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}