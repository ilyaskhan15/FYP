'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, Mail } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', confirmed: '#3b82f6', processing: '#a855f7',
  shipped: '#06b6d4', delivered: '#22c55e', cancelled: '#ef4444', refunded: '#71717a',
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin/analytics').then(r => r.json()),
  })

  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>

  const stats = data || {}
  const topProducts = stats.topProducts || []
  const recentOrders = stats.recentOrders || []
  const ordersByStatus = (stats.ordersByStatus || []) as Array<Record<string, unknown>>
  const productsByCategory = (stats.productsByCategory || []) as Array<Record<string, unknown>>

  const totalOrders = stats.totalOrders || 0
  const deliveredOrders = ordersByStatus.find(s => s.status === 'delivered')?.count || 0
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0

  const statCards = [
    { label: 'Total Revenue', value: `$${(stats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-950/50', change: '+12.5%', up: true },
    { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50', change: `${deliveryRate}% delivered`, up: deliveryRate > 50 },
    { label: 'Total Products', value: stats.totalProducts || 0, icon: Package, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50', change: 'Active', up: true },
    { label: 'Newsletter', value: stats.newsletterSubscribers || 0, icon: Mail, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50', change: 'Subscribers', up: true },
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50', change: 'Registered', up: true },
  ]

  const categoryData = productsByCategory.map(c => ({ name: c.name as string, value: c.count as number }))
  const statusData = ordersByStatus.map(s => ({ name: (s.status as string).charAt(0).toUpperCase() + (s.status as string).slice(1), value: s.count as number, fill: STATUS_COLORS[s.status as string] || '#71717a' }))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Overview</h2>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Products by Category</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }}
                    formatter={(value: number) => [`${value} products`, 'Products']}
                  />
                  <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
          </CardContent>
        </Card>

        {/* Orders by Status Pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Order Status Distribution</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="white" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e4e7' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top Selling Products</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p: Record<string, unknown>, i: number) => {
                const images: string[] = JSON.parse((p.images as string) || '[]')
                const maxSold = Math.max(...topProducts.map(t => t.soldCount as number), 1)
                const barWidth = Math.round(((p.soldCount as number) / maxSold) * 100)
                return (
                  <div key={p.id as string} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}</span>
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name as string}</p>
                      <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold">${(p.price as number).toFixed(2)}</span>
                  </div>
                )
              })}
              {topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sales data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {recentOrders.map((order: Record<string, unknown>) => {
                const items = (order.items as Record<string, unknown>[]) || []
                const statusColor: Record<string, string> = {
                  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
                  processing: 'bg-purple-100 text-purple-800', shipped: 'bg-cyan-100 text-cyan-800',
                  delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
                }
                return (
                  <div key={order.id as string} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-mono font-medium">{order.orderNumber as string}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt as string).toLocaleDateString()} · {items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${(order.total as number).toFixed(2)}</p>
                      <Badge variant="secondary" className={`text-[10px] ${statusColor[order.status as string] || 'bg-muted text-zinc-700'}`}>{order.status as string}</Badge>
                    </div>
                  </div>
                )
              })}
              {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet — they will appear here</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}