'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-muted text-zinc-700',
}

export default function AdminOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => fetch('/api/admin/orders').then(r => r.json()),
    staleTime: 0,
  })
  const orders: Record<string, unknown>[] = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : []
  const total = data?.pagination?.total ?? orders.length

  const updateStatus = async (orderId: string, status: string) => {
    // In a real app, this would call an API
    console.log(`Update order ${orderId} to ${status}`)
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Orders ({total})</h2>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Order #</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: Record<string, unknown>) => (
                    <tr key={order.id as string} className="border-b last:border-0 hover:bg-muted">
                      <td className="px-4 py-3 font-mono text-sm font-medium">{order.orderNumber as string}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {new Date(order.createdAt as string).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(order.items as Record<string, unknown>[])?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">${(order.total as number).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`text-[10px] ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.paymentStatus as string}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Select defaultValue={order.status as string} onValueChange={(v) => updateStatus(order.id as string, v)}>
                          <SelectTrigger className={`h-7 w-32 text-xs border-0 ${statusColors[order.status as string] || ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}