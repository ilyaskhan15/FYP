import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } })
      return NextResponse.json(coupons)
    }

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }
    if (!coupon.isValid) {
      return NextResponse.json({ error: 'Coupon is no longer valid' }, { status: 400 })
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'Coupon has reached maximum uses' }, { status: 400 })
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Coupons API error:', error)
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, type, value, minOrderAmount, maxUses, startsAt, expiresAt } = body

    const trimmedCode = typeof code === 'string' ? code.trim().toUpperCase() : ''

    if (!trimmedCode || trimmedCode.length < 3 || trimmedCode.length > 20) {
      return NextResponse.json(
        { error: 'Coupon code is required and must be 3-20 characters' },
        { status: 400 }
      )
    }

    if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      return NextResponse.json(
        { error: 'Coupon code must be alphanumeric (uppercase letters and numbers only)' },
        { status: 400 }
      )
    }

    const validTypes = ['fixed', 'percentage', 'free_shipping']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type must be one of: fixed, percentage, free_shipping' },
        { status: 400 }
      )
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { error: 'Value must be a positive number' },
        { status: 400 }
      )
    }

    if (type === 'percentage' && value > 100) {
      return NextResponse.json(
        { error: 'Percentage value cannot exceed 100' },
        { status: 400 }
      )
    }

    const existing = await db.coupon.findUnique({ where: { code: trimmedCode } })
    if (existing) {
      return NextResponse.json(
        { error: 'A coupon with this code already exists' },
        { status: 409 }
      )
    }

    const coupon = await db.coupon.create({
      data: {
        code: trimmedCode,
        type,
        value,
        minOrderAmount: typeof minOrderAmount === 'number' ? minOrderAmount : 0,
        maxUses: maxUses != null ? Number(maxUses) : null,
        isValid: true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('Create coupon error:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code query parameter is required' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    await db.coupon.delete({ where: { id: coupon.id } })

    return NextResponse.json({ success: true, message: 'Coupon deleted' })
  } catch (error) {
    console.error('Delete coupon error:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
