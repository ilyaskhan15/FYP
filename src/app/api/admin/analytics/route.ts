import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      topProducts,
      ordersByStatus,
      revenueByMonth,
    ] = await Promise.all([
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
      db.user.count(),
      db.order.aggregate({ where: { paymentStatus: 'paid' }, _sum: { total: true } }),
      db.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      db.product.findMany({ take: 5, orderBy: { soldCount: 'desc' }, select: { id: true, name: true, price: true, soldCount: true, stock: true, images: true } }),
      db.order.groupBy({ by: ['status'], _count: true }),
      // Simple monthly revenue (last 6 months approximation)
      db.order.aggregate({ where: { paymentStatus: 'paid' }, _sum: { total: true }, _count: true }),
    ])

    // Newsletter count — separate call to avoid breaking if model not yet loaded
    let newsletterSubscribers = 0
    try {
      const result = db.newsletter.count({ where: { isActive: true } })
      newsletterSubscribers = typeof result?.then === 'function' ? await result : 0
    } catch { /* model not available yet */ }

    const productsByCategory = await db.category.findMany({
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders,
      topProducts,
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
      productsByCategory: productsByCategory.map(c => ({ name: c.name, count: c._count.products })),
      newsletterSubscribers,
      revenueOverview: revenueByMonth,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
