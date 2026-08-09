import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seller/products?userId=xxx&page=1&limit=20 — list seller's products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get seller profile
    const seller = await db.sellerProfile.findUnique({
      where: { userId },
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    const where = { sellerId: seller.id }

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
    console.error('Seller products GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller products' },
      { status: 500 }
    )
  }
}

// POST /api/seller/products — create a new product for the seller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, price, stock, categoryId, brand, tags, images } =
      body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }
    if (price === undefined || price === null || price < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Get seller profile
    const seller = await db.sellerProfile.findUnique({
      where: { userId },
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    if (!seller.isApproved) {
      return NextResponse.json(
        { error: 'Seller account is not yet approved' },
        { status: 403 }
      )
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
        stock: parseInt(stock) || 0,
        brand: brand?.trim() || null,
        categoryId: categoryId || null,
        tags: tags?.trim() || null,
        images: JSON.stringify(parsedImages),
        sellerId: seller.id,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Seller products POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
