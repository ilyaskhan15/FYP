import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')

    // Fetch reviews for a specific user (account reviews page) — show all statuses
    if (userId) {
      const reviews = await db.review.findMany({
        where: { userId },
        include: {
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(reviews)
    }

    // Fetch approved reviews for a specific product (public product page)
    if (!productId) {
      return NextResponse.json({ error: 'Product ID or User ID required' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: { productId, status: 'approved' },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, rating, title, comment } = body

    const existing = await db.review.findUnique({ where: { userId_productId: { userId, productId } } })
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 })
    }

    // New reviews default to status: 'pending' (admin must approve)
    const review = await db.review.create({
      data: { userId, productId, rating, title, comment },
    })

    // Recalculate product rating from approved reviews only
    const approvedReviews = await db.review.findMany({ where: { productId, status: 'approved' } })
    const avgRating = approvedReviews.length > 0
      ? approvedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / approvedReviews.length
      : 0
    await db.product.update({
      where: { id: productId },
      data: { rating: Math.round(avgRating * 10) / 10, reviewCount: approvedReviews.length },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Create review API error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
