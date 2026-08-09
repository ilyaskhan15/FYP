'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Heart, Trash2 } from 'lucide-react'
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

  /* ---------- Fetch wishlist items (DB) ---------- */
  const { data: dbWishlistItems = [], isLoading: dbLoading, isError: dbError } = useQuery<WishlistProduct[]>({
    queryKey: ['wishlist-db', user?.id],
    queryFn: async () => {
      if (!user) return []
      const res = await fetch(`/api/wishlist?userId=${encodeURIComponent(user.id)}`)
      if (!res.ok) throw new Error('Failed to fetch wishlist')
      const items = await res.json()
      if (!Array.isArray(items)) return []
      return items.map((item: Record<string, unknown>) => {
        const product = item.product as Record<string, unknown> | undefined
        if (!product) return null
        return {
          id: String(item.productId || item.id || ''),
          productId: String(item.productId || ''),
          name: String(product.name || 'Unknown Product'),
          slug: String(product.slug || ''),
          price: Number(product.price || 0),
          compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
          rating: Number(product.rating || 0),
          reviewCount: Number(product.reviewCount || 0),
          stock: Number(product.stock || 0),
          image: product.image != null ? String(product.image) : null,
        }
      }).filter((p: WishlistProduct | null): p is WishlistProduct => p !== null)
    },
    enabled: isLoggedIn,
    retry: 1,
  })

  /* ---------- Fetch local wishlist products ---------- */
  const { data: localProducts = [], isLoading: localLoading } = useQuery({
    queryKey: ['wishlist-local', localWishlistIds],
    queryFn: async () => {
      if (localWishlistIds.length === 0) return []
      try {
        const res = await fetch('/api/products?limit=100')
        const data = await res.json()
        const products: Array<Record<string, unknown>> = data.products || []
        return products
          .filter((p) => localWishlistIds.includes(String(p.id)))
          .map((p) => {
            let images: string[] = []
            try {
              images = JSON.parse(String(p.images || '[]'))
            } catch { /* ignore */ }
            return {
              id: String(p.id),
              productId: String(p.id),
              name: String(p.name || 'Unknown'),
              slug: String(p.slug || ''),
              price: Number(p.price || 0),
              compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
              rating: Number(p.rating || 0),
              reviewCount: Number(p.reviewCount || 0),
              stock: Number(p.stock || 0),
              image: images.length > 0 ? images[0] : null,
            }
          })
      } catch {
        return []
      }
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

  const handleRemove = useCallback((e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
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

  /* ---------- Error state ---------- */
  if (dbError) {
    return (
      <div className="text-center py-16">
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="relative w-full h-full rounded-full bg-muted/80 flex items-center justify-center ring-1 ring-border">
            <Heart className="h-14 w-14 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Failed to load wishlist</h3>
        <p className="text-sm text-muted-foreground mb-6">Something went wrong. Please try again.</p>
        <Button className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900" onClick={() => queryClient.invalidateQueries({ queryKey: ['wishlist-db'] })}>Retry</Button>
      </div>
    )
  }

  /* ---------- Empty state ---------- */
  if (products.length === 0) {
    return (
      <div className="text-center py-16 relative overflow-hidden">
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
            <div
              onClick={() => navigate('product', p.id)}
              className="text-left w-full group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('product', p.id) }}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-muted" />}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">${p.price.toFixed(2)}</p>
            </div>
            <button
              onClick={(e) => handleRemove(e, p.id)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Remove from wishlist"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
