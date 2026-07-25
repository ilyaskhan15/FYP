import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!q.trim()) {
      return NextResponse.json({ products: [], pagination: { page, limit, total: 0, totalPages: 0 }, query: q })
    }

    const where = {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { brand: { contains: q } },
        { tags: { contains: q } },
      ],
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { soldCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, name: true, slug: true, price: true, compareAtPrice: true, images: true, rating: true, reviewCount: true, brand: true, stock: true },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      query: q,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}