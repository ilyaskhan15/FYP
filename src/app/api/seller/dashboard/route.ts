import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/seller/dashboard?userId=xxx — seller dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get seller profile
    const seller = await db.sellerProfile.findUnique({
      where: { userId },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Run all stats queries in parallel
    const [totalProducts, lowStockProducts, orderItems, recentOrders] =
      await Promise.all([
        // Total products count
        db.product.count({
          where: { sellerId: seller.id, isActive: true },
        }),

        // Products low in stock (stock < 10)
        db.product.findMany({
          where: { sellerId: seller.id, isActive: true, stock: { lt: 10 } },
          select: {
            id: true,
            name: true,
            slug: true,
            stock: true,
            price: true,
            images: true,
          },
          orderBy: { stock: 'asc' },
        }),

        // All order items for the seller's products (for revenue + order counting)
        db.orderItem.findMany({
          where: { product: { sellerId: seller.id } },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                paymentStatus: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        }),

        // Recent 5 distinct orders containing seller's products
        db.order.findMany({
          where: {
            items: {
              some: { product: { sellerId: seller.id } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              where: { product: { sellerId: seller.id } },
              include: {
                product: { select: { id: true, name: true, images: true } },
              },
            },
          },
        }),
      ])

    // Calculate total revenue: sum of (price * quantity) minus commission
    const commissionRate = seller.commission / 100
    let totalRevenue = 0
    const sellerOrderIds = new Set<string>()

    for (const item of orderItems) {
      const lineTotal = item.price * item.quantity
      const earnings = lineTotal * (1 - commissionRate)
      totalRevenue += earnings
      sellerOrderIds.add(item.orderId)
    }

    return NextResponse.json({
      profile: {
        id: seller.id,
        storeName: seller.storeName,
        storeSlug: seller.storeSlug,
        description: seller.description,
        logo: seller.logo,
        banner: seller.banner,
        isApproved: seller.isApproved,
        commission: seller.commission,
        createdAt: seller.createdAt,
      },
      stats: {
        totalProducts,
        totalOrders: sellerOrderIds.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      recentOrders,
      lowStockProducts,
    })
  } catch (error) {
    console.error('Seller dashboard GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seller dashboard' },
      { status: 500 }
    )
  }
}
