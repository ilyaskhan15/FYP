import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const

type ReviewStatus = (typeof VALID_STATUSES)[number]

// PUT /api/admin/reviews/[id] — Update review status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (pending, approved, rejected)' }, { status: 400 })
    }

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const review = await db.review.update({
      where: { id },
      data: { status },
      select: {
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
      },
    })

    // Recalculate product rating based on approved reviews
    const approvedReviews = await db.review.findMany({
      where: { productId: existing.productId, status: 'approved' },
    })
    const avgRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / approvedReviews.length
        : 0
    await db.product.update({
      where: { id: existing.productId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: approvedReviews.length,
      },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Admin reviews PUT error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews/[id] — Delete review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await db.review.delete({ where: { id } })

    // Recalculate product rating based on remaining approved reviews
    const approvedReviews = await db.review.findMany({
      where: { productId: existing.productId, status: 'approved' },
    })
    const avgRating =
      approvedReviews.length > 0
        ? approvedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / approvedReviews.length
        : 0
    await db.product.update({
      where: { id: existing.productId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: approvedReviews.length,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin reviews DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
  }
}
