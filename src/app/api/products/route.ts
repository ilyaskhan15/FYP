import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('id')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const isNew = searchParams.get('new')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Support fetching multiple products by comma-separated IDs
    if (ids) {
      const idList = ids.split(',').filter(Boolean).map((id) => id.trim())
      if (idList.length > 0) {
        const products = await db.product.findMany({
          where: { id: { in: idList } },
          include: {
            category: { select: { name: true, slug: true } },
            variants: { select: { id: true, attributes: true, name: true } },
            reviews: {
              where: { status: 'approved' },
              include: { user: { select: { name: true, image: true } } },
              orderBy: { createdAt: 'desc' },
            },
          },
        })
        return NextResponse.json({ products })
      }
    }

    const where: Record<string, unknown> = { isActive: true }

    if (category) where.category = { slug: category }
    if (brand) where.brand = brand
    if (minPrice) where.price = { ...((where.price as Record<string, unknown>) || {}), gte: parseFloat(minPrice) }
    if (maxPrice) where.price = { ...((where.price as Record<string, unknown>) || {}), lte: parseFloat(maxPrice) }
    if (rating) where.rating = { gte: parseFloat(rating) }
    if (featured === 'true') where.isFeatured = true
    if (isNew === 'true') where.isNew = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    type PrismaOrderBy = Record<string, string | Record<string, string>>
    let orderBy: PrismaOrderBy = { createdAt: 'desc' }
    if (sort === 'price-asc') orderBy = { price: 'asc' }
    else if (sort === 'price-desc') orderBy = { price: 'desc' }
    else if (sort === 'rating') orderBy = { rating: 'desc' }
    else if (sort === 'popular') orderBy = { soldCount: 'desc' }
    else if (sort === 'name-asc') orderBy = { name: 'asc' }
    else if (sort === 'name-desc') orderBy = { name: 'desc' }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          variants: { select: { id: true, attributes: true, name: true } },
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
    console.error('Products API error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}