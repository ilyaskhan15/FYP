import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seller/orders?userId=xxx&status=shipped&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || null

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

    // Build where clause for orders that contain at least one of the seller's products
    const orderWhere: Record<string, unknown> = {
      items: {
        some: { product: { sellerId: seller.id } },
      },
    }

    if (status) {
      orderWhere.status = status
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            where: { product: { sellerId: seller.id } },
            include: {
              product: { select: { id: true, name: true, images: true, slug: true } },
            },
          },
        },
      }),
      db.order.count({ where: orderWhere }),
    ])

    // Compute seller-specific totals per order
    const commissionRate = seller.commission / 100
    const ordersWithSellerInfo = orders.map((order) => {
      const sellerItems = order.items
      const sellerSubtotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const sellerEarnings = Math.round(sellerSubtotal * (1 - commissionRate) * 100) / 100

      return {
        ...order,
        sellerSubtotal,
        sellerEarnings,
      }
    })

    return NextResponse.json({
      orders: ordersWithSellerInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Seller orders GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller orders' },
      { status: 500 }
    )
  }
}
