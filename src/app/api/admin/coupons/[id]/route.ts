import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isValid } = body

    if (typeof isValid !== 'boolean') {
      return NextResponse.json(
        { error: 'isValid must be a boolean' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    const updated = await db.coupon.update({
      where: { id },
      data: { isValid },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Toggle coupon error:', error)
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}
