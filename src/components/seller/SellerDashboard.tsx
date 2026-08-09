'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function SellerDashboard() {
  const { user } = useAuthStore()
  const userId = user?.id

  const { data, isLoading } = useQuery({
    queryKey: ['seller-dashboard', userId],
    queryFn: () => fetch(`/api/seller/dashboard?userId=${userId}`).then(r => r.json()),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Overview</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const stats = data || {}
  const totalProducts = stats.totalProducts ?? 0
  const totalOrders = stats.totalOrders ?? 0
  const revenue = stats.revenue ?? 0
  const lowStockProducts: Record<string, unknown>[] = Array.isArray(stats.lowStockProducts) ? stats.lowStockProducts : []
  const recentOrders: Record<string, unknown>[] = Array.isArray(stats.recentOrders) ? stats.recentOrders : []

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statCards = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
      change: `${lowStockProducts.length} low stock`,
      up: lowStockProducts.length === 0,
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
      change: `${recentOrders.filter(o => o.status === 'pending').length} pending`,
      up: true,
    },
    {
      label: 'Revenue',
      value: `$${formatCurrency(revenue)}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50 dark:bg-green-950/50',
      change: 'Lifetime earnings',
      up: true,
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 dark:bg-red-950/50',
      change: lowStockProducts.length > 0 ? 'Needs attention' : 'All good',
      up: lowStockProducts.length === 0,
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />Overview
      </h2>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className={`text-xs mt-1 flex items-center gap-1 ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                {card.up && <ArrowUpRight className="h-3 w-3" />}
                {card.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No orders yet — they will appear here</p>
              ) : (
                recentOrders.slice(0, 5).map((order: Record<string, unknown>) => {
                  const sellerEarnings = order.sellerEarnings as number | undefined
                  const orderItems = (order.items as Record<string, unknown>[]) || []
                  return (
                    <div key={order.id as string} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium">{order.orderNumber as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt as string).toLocaleDateString()} · {order.customerName as string}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold">
                          {sellerEarnings != null ? `$${sellerEarnings.toFixed(2)}` : `$${(order.total as number)?.toFixed(2) || '0.00'}`}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${statusColors[order.status as string] || 'bg-muted text-zinc-700'}`}
                        >
                          {order.status as string}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All products are well-stocked</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((product: Record<string, unknown>) => {
                  const images: string[] = (() => { try { return JSON.parse((product.images as string) || '[]') } catch { return [] } })()
                  const stock = product.stock as number
                  return (
                    <div key={product.id as string} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name as string}</p>
                        <p className="text-xs text-muted-foreground">${(product.price as number).toFixed(2)}</p>
                      </div>
                      <Badge
                        variant={stock === 0 ? 'destructive' : 'secondary'}
                        className={stock === 0 ? '' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}
                      >
                        {stock === 0 ? 'Out of stock' : `${stock} left`}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
