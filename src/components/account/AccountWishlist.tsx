'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Heart, Trash2 } from 'lucide-react'
import ProductCard from '../storefront/ProductCard'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const LOCAL_WISHLIST_KEY = 'wishlist'

function getLocalWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_WISHLIST_KEY) || '[]')
  } catch {
    return []
  }
}

interface WishlistProduct {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  compareAtPrice: number | null
  rating: number
  reviewCount: number
  stock: number
  image: string | null
}

export default function AccountWishlist() {
  const { navigate } = useNavigationStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const isLoggedIn = !!user

  /* ---------- Local wishlist state (for fallback) ---------- */
  const [localWishlistIds, setLocalWishlistIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    return getLocalWishlist()
  })

  /* ---------- Fetch wishlist items ---------- */
  const { data: dbWishlistItems = [], isLoading: dbLoading } = useQuery<WishlistProduct[]>({
    queryKey: ['wishlist-db', user?.id],
    queryFn: async () => {
      if (!user) return []
      const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(user.id)}`)
      if (!res.ok) throw new Error('Failed to fetch wishlist')
      const items = await res.json()
      return items.map((item: { productId: string; product: { id: string; name: string; slug: string; price: number; compareAtPrice: number | null; rating: number; reviewCount: number; stock: number; image: string | null } }) => ({
        id: item.productId,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        rating: item.product.rating,
        reviewCount: item.product.reviewCount,
        stock: item.product.stock,
        image: item.product.image,
      }))
    },
    enabled: isLoggedIn,
  })

  /* ---------- Fetch local wishlist products ---------- */
  const { data: localProducts = [], isLoading: localLoading } = useQuery({
    queryKey: ['wishlist-local', localWishlistIds],
    queryFn: async () => {
      if (localWishlistIds.length === 0) return []
      const res = await fetch('/api/products?limit=100')
      const data = await res.json()
      const products = data.products || []
      return products
        .filter((p: { id: string }) => localWishlistIds.includes(p.id))
        .map((p: { id: string; name: string; slug: string; price: number; compareAtPrice: number | null; rating: number; reviewCount: number; stock: number; images: string }) => {
          const images: string[] = JSON.parse(p.images || '[]')
          return {
            id: p.id,
            productId: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            rating: p.rating,
            reviewCount: p.reviewCount,
            stock: p.stock,
            image: images[0] || null,
          }
        })
    },
    enabled: !isLoggedIn,
  })

  /* ---------- Remove from wishlist ---------- */
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (isLoggedIn && user) {
        const res = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId }),
        })
        if (!res.ok) throw new Error('Failed to remove from wishlist')
      } else {
        const wishlist = getLocalWishlist().filter((id) => id !== productId)
        localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlist))
        setLocalWishlistIds(wishlist)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-db'] })
      queryClient.invalidateQueries({ queryKey: ['wishlist-local'] })
      toast.success('Removed from wishlist')
    },
    onError: () => {
      toast.error('Failed to remove from wishlist')
    },
  })

  const handleRemove = useCallback((productId: string) => {
    removeMutation.mutate(productId)
  }, [removeMutation])

  /* ---------- Derive display data ---------- */
  const isLoading = isLoggedIn ? dbLoading : localLoading
  const products = isLoggedIn ? dbWishlistItems : localProducts

  /* ---------- Loading skeleton ---------- */
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square bg-muted rounded-xl animate-pulse" />
            <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  /* ---------- Empty state ---------- */
  if (products.length === 0) {
    return (
      <div className="text-center py-16 relative overflow-hidden">
        {/* Floating decorative hearts */}
        <div className="floating-heart" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <div className="floating-heart" style={{ top: '20%', right: '20%', animationDelay: '1.2s', width: '16px', height: '16px' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-rose-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <div className="floating-heart" style={{ bottom: '25%', left: '25%', animationDelay: '0.6s', width: '10px', height: '10px' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-orange-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <div className="floating-heart" style={{ bottom: '15%', right: '15%', animationDelay: '2s', width: '14px', height: '14px' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-pink-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>

        <div className="relative z-10">
          {/* Gradient circle behind heart icon */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-muted/80 flex items-center justify-center ring-1 ring-border">
              <Heart className="h-14 w-14 text-rose-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-muted-foreground mb-6">Save items you love for later</p>
          <Button className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900" onClick={() => navigate('shop')}>Browse Products</Button>
        </div>
      </div>
    )
  }

  /* ---------- Product grid ---------- */
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Wishlist ({products.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="relative group">
            <button onClick={() => navigate('product', p.id)} className="text-left w-full group">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-muted" />}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">${p.price.toFixed(2)}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(p.id) }}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}