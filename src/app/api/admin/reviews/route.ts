import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, string | object> = {}

    if (statusFilter === 'approved' || statusFilter === 'pending' || statusFilter === 'rejected') {
      where.status = statusFilter
    }

    if (search) {
      const searchConditions = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { name: { contains: search } } },
        { comment: { contains: search } },
      ]
      where.OR = searchConditions
    }

    const selectFields = {
      id: true,
      rating: true,
      title: true,
      comment: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      productId: true,
      user: {
        select: { name: true, email: true },
      },
      product: {
        select: { name: true, slug: true, images: true },
      },
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        select: selectFields,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin reviews GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}
