'use client'

import { useCartStore } from '@/stores/cart'
import { useNavigationStore } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus, X, ShoppingBag, ArrowLeft, ArrowRight, Tag, Truck, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'

export default function CartPage() {
  const { items, updateQuantity, removeItem, addItem, clearCart, subtotal, shipping, tax, appliedCoupon, applyCoupon, removeCoupon, discount, total } = useCartStore()
  const { navigate } = useNavigationStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const couponDiscount = discount()
  const couponApplied = !!appliedCoupon

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const res = await fetch(`/api/coupons?code=${couponCode}`)
      const data = await res.json()
      if (data.error) {
        setCouponError(data.error)
        removeCoupon()
        toast.error(data.error)
        return
      }
      setCouponError('')
      let calcDiscount = 0
      if (data.type === 'fixed') calcDiscount = data.value
      else if (data.type === 'percentage') calcDiscount = subtotal() * (data.value / 100)
      else if (data.type === 'free_shipping') calcDiscount = shipping()
      applyCoupon(couponCode.toUpperCase(), calcDiscount)
      toast.success(`Coupon applied! You save $${calcDiscount.toFixed(2)}`)
    } catch {
      setCouponError('Invalid coupon')
      toast.error('Invalid coupon code')
    }
  }

  const handleRemoveItem = useCallback((item: typeof items[0]) => {
    // Store item data before removal for undo
    const itemData = { ...item }
    removeItem(item.id)
    toast(`${item.name} removed from cart`, {
      description: 'The item has been removed.',
      action: {
        label: 'Undo',
        onClick: () => {
          addItem(itemData)
          toast.success(`${itemData.name} added back to cart`)
        },
      },
      duration: 5000,
    })
  }, [removeItem, addItem])

  const handleClearCart = useCallback(() => {
    const removedItems = [...items]
    clearCart()
    toast('Cart cleared', {
      description: `${removedItems.length} item${removedItems.length !== 1 ? 's' : ''} removed from your cart.`,
      action: {
        label: 'Undo',
        onClick: () => {
          removedItems.forEach(item => {
            addItem(item)
          })
          toast.success('Cart restored')
        },
      },
      duration: 6000,
    })
  }, [clearCart, items, addItem])

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl" />
        <div className="absolute bottom-20 right-16 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-amber-400/10 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 left-1/5 w-2 h-2 rounded-full bg-orange-400/10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-4 h-4 rounded-full bg-amber-400/8 animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10">
          {/* Gradient circle behind icon */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-muted/80 flex items-center justify-center ring-1 ring-border">
              <ShoppingBag className="h-14 w-14 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Looks like you haven&apos;t added anything yet.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('shop')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
            <Button variant="outline" onClick={() => { navigate('shop') }}>
              <Sparkles className="h-4 w-4 mr-2" />
              View Deals
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate('shop')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Continue Shopping
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Shopping Cart ({items.length})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id} className="border shadow-none">
              <CardContent className="p-4 flex gap-4">
                <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0 cursor-pointer" onClick={() => navigate('product', item.productId)}>
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-foreground cursor-pointer hover:underline" onClick={() => navigate('product', item.productId)}>{item.name}</h3>
                      {item.variantName && <p className="text-sm text-muted-foreground mt-0.5">{item.variantName}</p>}
                    </div>
                    <button onClick={() => handleRemoveItem(item)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border rounded-lg">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                      {item.compareAtPrice && (
                        <p className="text-sm text-muted-foreground line-through">${(item.compareAtPrice * item.quantity).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={handleClearCart} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:hover:bg-red-950">
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-32">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Order Summary</h2>

              {/* Coupon */}
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError('') }}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponApplied}>Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                {couponApplied && <p className="text-xs text-green-600 mt-1">✓ Coupon applied! You save ${couponDiscount.toFixed(2)}</p>}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal().toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span>
                  <span>{shipping() === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${shipping().toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>${tax().toFixed(2)}</span></div>
                {couponApplied && couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount ({appliedCoupon!.code})</span><span>-${couponDiscount.toFixed(2)}</span></div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>

              {shipping() > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg">
                  <Truck className="h-4 w-4 text-amber-600 shrink-0" />
                  Add ${(75 - subtotal()).toFixed(2)} more for free shipping
                </div>
              )}

              <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold" onClick={() => {
                navigate('checkout')
              }}>
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
