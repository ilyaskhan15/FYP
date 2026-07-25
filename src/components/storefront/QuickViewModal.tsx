'use client'

import { useState } from 'react'
import { useCartStore } from '@/stores/cart'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, StarHalf, Minus, Plus, ShoppingCart, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface QuickViewProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  images: string
  rating: number
  reviewCount: number
  brand?: string | null
  isNew?: boolean
  description?: string | null
  stock?: number
}

interface QuickViewModalProps {
  product: QuickViewProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) return null

  const images: string[] = JSON.parse(product.images || '[]')
  const image = images[0] || '/placeholder.png'
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0
  const isOutOfStock = product.stock === 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity,
      stock: product.stock || 99,
    })
    setAdded(true)
    toast.success(`${quantity}x ${product.name} added to cart`)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuantity(1)
      setAdded(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.isNew && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">NEW</Badge>
              )}
              {hasDiscount && (
                <Badge className="bg-red-600 text-white text-[10px] px-2 py-0.5">-{discountPercent}%</Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-5 sm:p-6 flex flex-col">
            <DialogHeader className="space-y-0 mb-3">
              <div className="flex items-center justify-between">
                <DialogDescription className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {product.brand || 'NOVA STORE'}
                </DialogDescription>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  Quick View
                </div>
              </div>
              <DialogTitle className="text-lg font-semibold leading-snug">
                {product.name}
              </DialogTitle>
            </DialogHeader>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < Math.floor(product.rating)
                  const half = !filled && i < product.rating
                  return filled ? (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ) : half ? (
                    <StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ) : (
                    <Star key={i} className="h-3.5 w-3.5 text-muted" />
                  )
                })}
              </div>
              <span className="text-xs text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {product.description}
              </p>
            )}

            <div className="mt-auto space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-sm font-medium tabular-nums">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() =>
                      setQuantity((q) => Math.min((product.stock || 99), q + 1))
                    }
                    disabled={quantity >= (product.stock || 99)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {isOutOfStock && (
                  <span className="text-xs text-red-500 font-medium">Out of stock</span>
                )}
              </div>

              {/* Add to Cart */}
              <Button
                className="w-full font-medium"
                size="lg"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {added ? 'Added ✓' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}