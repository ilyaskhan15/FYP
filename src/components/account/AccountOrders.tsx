'use client'

import { useAuthStore } from '@/stores/auth'
import { useNavigationStore } from '@/stores/navigation'
import { useCartStore } from '@/stores/cart'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ChevronDown, ChevronUp, ShoppingCart, MapPin, Truck, CreditCard } from 'lucide-react'
import { useState } from 'react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
  shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
  refunded: 'bg-muted text-zinc-800 dark:text-zinc-300',
}

interface OrderItem {
  id: string
  productId: string
  variantId?: string
  productName: string
  productImage?: string
  variantName?: string
  price: number
  quantity: number
}

interface ShippingAddr {
  name?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export default function AccountOrders() {
  const { user } = useAuthStore()
  const { navigate } = useNavigationStore()
  const { addItem } = useCartStore()
  const { data, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => fetch(`/api/orders?userId=${user!.id}`).then(r => r.json()),
    enabled: !!user?.id,
    staleTime: 0,
  })
  const orders = (data || []) as Record<string, unknown>[]
  const [expanded, setExpanded] = useState<string | null>(null)

  const handleReorder = (items: OrderItem[]) => {
    let addedCount = 0
    for (const item of items) {
      addItem({
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.productName,
        image: item.productImage || '',
        price: item.price,
        quantity: item.quantity,
        stock: 999,
      })
      addedCount += item.quantity
    }
    toast.success(`${addedCount} item${addedCount !== 1 ? 's' : ''} added to cart`)
    navigate('cart')
  }

  const formatAddress = (addrJson: string | null | undefined): ShippingAddr => {
    if (!addrJson) return {}
    try { return JSON.parse(addrJson) as ShippingAddr }
    catch { return {} }
  }

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>

  if (orders.length === 0) return (
    <div className="text-center py-12">
      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">No orders yet</h3>
      <p className="text-sm text-muted-foreground mb-4">Your order history will appear here</p>
      <Button className="bg-zinc-900 hover:bg-zinc-800" onClick={() => navigate('shop')}>Start Shopping</Button>
    </div>
  )

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Order History</h2>
      <div className="space-y-3">
        {orders.map((order) => {
          const items = (order.items as OrderItem[]) || []
          const isExpanded = expanded === (order.id as string)
          const addr = formatAddress(order.shippingAddress as string | null | undefined)
          const status = order.status as string
          const orderNumber = order.orderNumber as string
          const createdAt = order.createdAt as string
          const subtotalVal = order.subtotal as number
          const shippingCostVal = order.shippingCost as number
          const taxVal = order.tax as number
          const discountVal = (order.discount as number) || 0
          const totalVal = order.total as number
          const coupon = order.couponCode as string | null | undefined
          const paymentMethod = order.paymentMethod as string | null | undefined
          const trackingNumber = order.trackingNumber as string | null | undefined

          return (
            <Card key={order.id as string} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Order Header - Collapsible trigger */}
                <button onClick={() => setExpanded(isExpanded ? null : (order.id as string))} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 text-left">
                    <div>
                      <p className="font-mono text-sm font-medium">{orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[status] || ''}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">${totalVal.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right sm:hidden">
                      <p className="text-sm font-semibold">${totalVal.toFixed(2)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded Order Detail */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Order Info Bar */}
                    <div className="px-4 py-3 bg-muted/30 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-b">
                      <span>Order #{orderNumber}</span>
                      <span>{new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <Badge variant="secondary" className={`text-xs ${statusColors[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                    </div>

                    <div className="p-4 md:p-6">
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Items List (takes 2 cols) */}
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Items ({items.length})
                          </h3>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg">
                                <div
                                  className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0 cursor-pointer border"
                                  onClick={() => navigate('product', item.productId)}
                                >
                                  {item.productImage ? (
                                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate cursor-pointer hover:underline" onClick={() => navigate('product', item.productId)}>{item.productName}</p>
                                  {item.variantName && <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>}
                                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                  {item.quantity > 1 && <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Sidebar: Shipping & Summary */}
                        <div className="space-y-4">
                          {/* Shipping Address */}
                          {addr.street && (
                            <div>
                              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Shipping Address
                              </h3>
                              <div className="text-sm text-muted-foreground space-y-0.5 p-3 bg-muted/40 rounded-lg">
                                {addr.name && <p className="font-medium text-foreground">{addr.name}</p>}
                                {addr.street && <p>{addr.street}</p>}
                                {(addr.city || addr.state || addr.zip) && (
                                  <p>{[addr.city, addr.state].filter(Boolean).join(', ')} {addr.zip}</p>
                                )}
                                {addr.country && <p>{addr.country}</p>}
                                {addr.phone && <p className="mt-1">{addr.phone}</p>}
                              </div>
                            </div>
                          )}

                          {/* Shipping Method & Tracking */}
                          <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Delivery
                            </h3>
                            <div className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg space-y-1">
                              <p className="capitalize">{(order.shippingMethod as string) || 'Standard Shipping'}</p>
                              {trackingNumber && (
                                <p className="text-xs">Tracking: <span className="font-mono text-foreground">{trackingNumber}</span></p>
                              )}
                              {paymentMethod && (
                                <div className="flex items-center gap-1.5 pt-1 border-t mt-1">
                                  <CreditCard className="h-3 w-3" />
                                  <span className="text-xs capitalize">{paymentMethod}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div>
                            <h3 className="text-sm font-semibold mb-2">Order Summary</h3>
                            <div className="text-sm space-y-1.5 p-3 bg-muted/40 rounded-lg">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>${subtotalVal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{shippingCostVal === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${shippingCostVal.toFixed(2)}`}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span>${taxVal.toFixed(2)}</span>
                              </div>
                              {discountVal > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount{coupon ? ` (${coupon})` : ''}</span>
                                  <span>-${discountVal.toFixed(2)}</span>
                                </div>
                              )}
                              <Separator className="my-1.5" />
                              <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>${totalVal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reorder Button */}
                      <div className="mt-6 pt-4 border-t flex justify-end">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleReorder(items)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Reorder Items
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}