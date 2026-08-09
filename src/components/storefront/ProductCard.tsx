'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useCartStore } from '@/stores/cart'
import { useComparisonStore } from '@/stores/comparison'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Star, Eye, GitCompareArrows, Zap } from 'lucide-react'
import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ProductCardProps {
  product: {
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
    stock?: number
    description?: string | null
    variants?: Array<{
      id: string
      attributes?: string | null
      name?: string
    }>
  }
  onQuickView?: (product: ProductCardProps['product']) => void
}

function getStockStatus(stock?: number): { label: string; color: string; dotColor: string } | null {
  if (stock === undefined || stock === null) return null
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-500', dotColor: 'bg-red-500' }
  if (stock <= 5) return { label: `Only ${stock} left`, color: 'text-amber-600', dotColor: 'bg-amber-500' }
  return { label: 'In Stock', color: 'text-emerald-600', dotColor: 'bg-emerald-500' }
}

function ColorSwatches({ variants }: { variants?: Array<{ id: string; attributes?: string | null; name?: string }> }) {
  if (!variants || variants.length === 0) return null

  const uniqueColors = variants
    .map((v) => {
      try {
        const attrs = v.attributes ? JSON.parse(v.attributes) : {}
        return { id: v.id, color: attrs.color as string | undefined, colorName: attrs.color as string | undefined }
      } catch { return null }
    })
    .filter((c): c is { id: string; color: string; colorName: string } => !!c?.color)
    .reduce((acc, c) => {
      if (!acc.find((existing) => existing.color === c.color)) acc.push(c)
      return acc
    }, [] as Array<{ id: string; color: string; colorName: string }>)

  if (uniqueColors.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {uniqueColors.slice(0, 5).map((c) => (
        <span
          key={c.id}
          className="h-3.5 w-3.5 rounded-full border border-border shadow-sm flex-shrink-0 transition-transform hover:scale-125"
          style={{ backgroundColor: c.color }}
          title={c.colorName || c.color}
        />
      ))}
      {uniqueColors.length > 5 && (
        <span className="text-[10px] text-muted-foreground leading-none">+{uniqueColors.length - 5}</span>
      )}
    </div>
  )
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { navigate } = useNavigationStore()
  const { addItem } = useCartStore()
  const { addToComparison, removeFromComparison, isInComparison } = useComparisonStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isLoggedIn = !!user

  // User-specific localStorage key so different users don't share wishlist heart state
  const wishlistKey = `wishlist-${user?.id || 'guest'}`

  // Track previous wishlist key to detect user changes and reset state during render
  // (React-recommended pattern instead of useEffect + setState)
  const [prevWishlistKey, setPrevWishlistKey] = useState(wishlistKey)
  const [isWishlisted, setIsWishlisted] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const wishlist: string[] = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
      return wishlist.includes(product.id)
    } catch {
      return false
    }
  })

  if (prevWishlistKey !== wishlistKey) {
    setPrevWishlistKey(wishlistKey)
    try {
      const wishlist: string[] = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
      setIsWishlisted(wishlist.includes(product.id))
    } catch {
      setIsWishlisted(false)
    }
  }

  const [addedToCart, setAddedToCart] = useState(false)
  const inComparison = isInComparison(product.id)

  const images: string[] = JSON.parse(product.images || '[]')
  const image = images[0] || '/placeholder.png'
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercent = hasDiscount ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) : 0
  const stockStatus = getStockStatus(product.stock)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      image,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      stock: product.stock || 99,
    })
    setAddedToCart(true)
    toast.success(`${product.name} added to cart`)
    setTimeout(() => setAddedToCart(false), 1500)
  }

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !isWishlisted
    setIsWishlisted(next)

    // Always update localStorage for immediate UI consistency (user-specific key)
    const wishlist: string[] = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
    if (next) {
      wishlist.push(product.id)
    } else {
      const idx = wishlist.indexOf(product.id)
      if (idx > -1) wishlist.splice(idx, 1)
    }
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist))

    // If logged in, also sync to DB
    if (isLoggedIn && user) {
      if (next) {
        fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId: product.id }),
        }).catch(() => {
          toast.error('Failed to add to wishlist')
          setIsWishlisted(false)
        })
      } else {
        fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId: product.id }),
        }).catch(() => {
          toast.error('Failed to remove from wishlist')
          setIsWishlisted(true)
        })
      }
    }

    toast.success(next ? 'Added to wishlist' : 'Removed from wishlist')
    queryClient.invalidateQueries({ queryKey: ['wishlist-db'] })
    queryClient.invalidateQueries({ queryKey: ['wishlist-local'] })
  }, [isWishlisted, isLoggedIn, user, product.id, queryClient, wishlistKey])

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (inComparison) {
      removeFromComparison(product.id)
      toast.success('Removed from comparison')
    } else {
      const success = addToComparison(product.id)
      if (!success) {
        toast.error('You can compare up to 4 products at a time')
      } else {
        toast.success('Added to comparison')
      }
    }
  }, [inComparison, product.id, addToComparison, removeFromComparison])

  return (
    <Card
      className="group cursor-pointer overflow-hidden border border-transparent hover:border-amber-500/30 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out bg-card rounded-xl"
      onClick={() => navigate('product', product.id)}
    >
      <div className="relative aspect-square overflow-hidden bg-muted rounded-t-xl card-shimmer">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 hover:from-amber-500 hover:to-orange-500 rounded-md font-semibold tracking-wide border-0">NEW</Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] px-2 py-0.5 hover:from-red-500 hover:to-rose-600 rounded-md font-semibold border-0 flex items-center gap-0.5">
              <Zap className="h-2.5 w-2.5" />-{discountPercent}%
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="bg-zinc-500 text-white text-[10px] px-2 py-0.5 hover:bg-zinc-600 rounded-md font-semibold">SOLD OUT</Badge>
          )}
        </div>

        {/* SALE badge variant (smaller, different position) */}
        {hasDiscount && (
          <Badge className="absolute top-3 right-14 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold border-0 tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            SALE
          </Badge>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 ease-out">
          {onQuickView && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickView(product) }}
              className="h-8 w-8 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm flex items-center justify-center hover:bg-background dark:hover:bg-zinc-700 shadow-md transition-colors"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
            </button>
          )}
          <button
            onClick={handleCompare}
            className={`h-8 w-8 rounded-full backdrop-blur-sm flex items-center justify-center shadow-md transition-colors ${inComparison ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-background dark:hover:bg-zinc-700'}`}
            aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
          >
            <GitCompareArrows className={`h-4 w-4 transition-colors duration-200 ${inComparison ? 'text-white dark:text-zinc-900' : 'text-zinc-700 dark:text-zinc-200'}`} />
          </button>
          <button
            onClick={handleWishlist}
            className="h-8 w-8 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm flex items-center justify-center hover:bg-background dark:hover:bg-zinc-700 shadow-md transition-colors"
          >
            <Heart className={`h-4 w-4 transition-colors duration-200 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground dark:text-muted-foreground'}`} />
          </button>
        </div>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <Button
            size="sm"
            className={`w-full text-xs font-medium shadow-lg transition-all duration-200 rounded-lg animate-slide-up ${addedToCart ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-sm hover:from-zinc-800 hover:to-zinc-700 text-white'}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            {addedToCart ? 'Added ✓' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      <CardContent className="p-3.5 pt-3">
        {product.brand && (
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-1.5 group-hover:text-muted-foreground transition-colors duration-200">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-foreground">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            ({product.reviewCount})
          </span>
          {stockStatus && product.stock !== 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dotColor}`} />
                <span className={`text-[11px] font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
              </span>
            </>
          )}
        </div>

        {/* Color swatches */}
        <ColorSwatches variants={product.variants} />

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-foreground">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice!.toFixed(2)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}