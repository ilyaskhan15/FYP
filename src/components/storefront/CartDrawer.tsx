'use client'

import { useCartStore, type CartItem } from '@/stores/cart'
import { useNavigationStore } from '@/stores/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, shipping, tax, total } = useCartStore()
  const { navigate } = useNavigationStore()

  const handleCheckout = () => {
    closeCart()
    navigate('checkout')
  }

  const handleViewCart = () => {
    closeCart()
    navigate('cart')
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeCart() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-4">Add items to get started</p>
            <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => { closeCart(); navigate('shop') }}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-medium text-foreground line-clamp-1">{item.name}</h4>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                          )}
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                          {item.compareAtPrice && item.compareAtPrice > item.price && (
                            <p className="text-xs text-muted-foreground line-through">${(item.compareAtPrice * item.quantity).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">{shipping() === 0 ? 'Free' : `$${shipping().toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${tax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">${total().toFixed(2)}</span>
              </div>
              <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold" onClick={handleCheckout}>
                Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full h-10" onClick={handleViewCart}>
                View Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}