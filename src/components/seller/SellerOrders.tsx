'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, ChevronUp, Package, ShoppingCart } from 'lucide-react'

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered'

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

interface SellerOrderItem {
  id: string
  productName: string
  quantity: number
  price: number
  productImage?: string
}

interface SellerOrder {
  id: string
  orderNumber: string
  createdAt: string
  customerName: string
  status: string
  sellerEarnings: number
  sellerItemCount: number
  items: SellerOrderItem[]
}

export default function SellerOrders() {
  const { user } = useAuthStore()
  const userId = user?.id
  const [activeTab, setActiveTab] = useState<StatusFilter>('all')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', userId, activeTab],
    queryFn: () => {
      const params = new URLSearchParams({ userId: userId! })
      if (activeTab !== 'all') params.set('status', activeTab)
      return fetch(`/api/seller/orders?${params}`).then(r => r.json())
    },
    enabled: !!userId,
  })

  const orders: SellerOrder[] = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : []
  const total = data?.pagination?.total ?? orders.length

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId))
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Orders ({total})</h2>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as StatusFilter)} className="mb-4">
        <TabsList className="h-9">
          {statusTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-3" />
              <p className="text-sm">
                {activeTab === 'all'
                  ? 'No orders yet'
                  : `No ${activeTab} orders`}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id
                return (
                  <div key={order.id}>
                    {/* Order Row */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      {/* Expand icon */}
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-4 items-center">
                        <div className="sm:col-span-1">
                          <p className="text-sm font-mono font-medium">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="sm:col-span-1">
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.sellerItemCount} item{order.sellerItemCount !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="sm:col-span-1">
                          <p className="text-xs text-muted-foreground hidden sm:block">Earnings</p>
                          <p className="text-sm font-semibold">${order.sellerEarnings.toFixed(2)}</p>
                        </div>

                        <div className="sm:col-span-1">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${statusColors[order.status] || 'bg-muted text-zinc-700'}`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Items */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <div className="px-4 pb-4 ml-7">
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                          {order.items.map((item) => {
                            const images: string[] = (() => {
                              try {
                                return item.productImage ? [item.productImage] : []
                              } catch {
                                return []
                              }
                            })()
                            return (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded bg-background border overflow-hidden shrink-0">
                                  {images[0] ? (
                                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
