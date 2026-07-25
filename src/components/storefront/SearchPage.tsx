'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, X, Store } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'

function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-2 px-0.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-6" />
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const { searchQuery, setSearchQuery, navigate } = useNavigationStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)

  useEffect(() => { setLocalQuery(searchQuery) }, [searchQuery])

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=24`).then(r => r.json()),
    enabled: searchQuery.length > 0,
  })

  const products = data?.products || []
  const pagination = data?.pagination || {}

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (localQuery.trim()) setSearchQuery(localQuery.trim())
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for products, brands, categories..."
            className="pl-12 pr-10 h-12 text-base rounded-xl border-2 focus-visible:ring-0 focus-visible:border-foreground"
            autoFocus
          />
          {localQuery && (
            <button type="button" onClick={() => { setLocalQuery(''); setSearchQuery('') }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {searchQuery && (
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Searching...' : `${pagination.total || 0} results for "${searchQuery}"`}
          </p>
        </div>
      )}

      {!searchQuery ? (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">Start searching</p>
          <p className="text-sm text-muted-foreground">Type to find products, brands, and more</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 relative overflow-hidden">
          {/* Decorative dots */}
          <div className="absolute top-16 left-1/4 w-2 h-2 rounded-full bg-amber-400/15 animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-24 right-1/3 w-3 h-3 rounded-full bg-orange-400/10 animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-20 left-1/3 w-2.5 h-2.5 rounded-full bg-amber-400/10 animate-float" style={{ animationDelay: '0.8s' }} />

          <div className="relative z-10">
            <div className="h-24 w-24 rounded-full bg-muted/80 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle ring-1 ring-border">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No results found</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Try different keywords or browse our categories
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('shop')} className="gap-2">
                <Store className="h-4 w-4" />
                Browse Categories
              </Button>
              <Button variant="ghost" onClick={() => { setLocalQuery(''); setSearchQuery('') }} className="gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                Clear Search
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p: Record<string, unknown>) => (
            <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']} />
          ))}
        </div>
      )}
    </div>
  )
}