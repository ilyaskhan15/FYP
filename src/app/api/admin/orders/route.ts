import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, string | object> = {}

    if (status && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          shippingCost: true,
          tax: true,
          discount: true,
          total: true,
          paymentMethod: true,
          paymentStatus: true,
          couponCode: true,
          shippingMethod: true,
          trackingNumber: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: { name: true, email: true },
          },
          items: {
            select: { id: true, productName: true, quantity: true, price: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, trackingNumber } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existing = await db.order.findUnique({ where: { id: orderId } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: Record<string, string> = { status }
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }
    if (status === 'cancelled' || status === 'refunded') {
      // Restore stock for cancelled/refunded orders
      const orderItems = await db.orderItem.findMany({ where: { orderId } })
      for (const item of orderItems) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
        })
      }
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: updateData,
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Admin orders PUT error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
