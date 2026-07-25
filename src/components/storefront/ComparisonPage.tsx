'use client'

import { useComparisonStore } from '@/stores/comparison'
import { useNavigationStore } from '@/stores/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { X, GitCompareArrows, ArrowLeft, Star } from 'lucide-react'
import { useMemo } from 'react'

interface ProductData {
  id: string
  name: string
  price: number
  compareAtPrice?: number | null
  rating: number
  reviewCount: number
  stock: number
  brand?: string | null
  description?: string | null
  images: string
  category?: { name: string; slug: string } | null
  tags?: string | null
  sku?: string | null
  soldCount: number
}

function getFirstImage(images: string): string {
  try {
    const arr = JSON.parse(images || '[]')
    return arr[0] || '/placeholder.png'
  } catch {
    return '/placeholder.png'
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating)
              ? 'fill-amber-400 text-amber-400'
              : i < rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export default function ComparisonPage() {
  const { productIds, clearComparison, removeFromComparison } = useComparisonStore()
  const { navigate, goBack } = useNavigationStore()

  const ids = useMemo(() => productIds.join(','), [productIds])

  const { data, isLoading } = useQuery({
    queryKey: ['comparison', ids],
    queryFn: () => fetch(`/api/products?id=${ids}`).then((r) => r.json()),
    enabled: productIds.length >= 2,
  })

  const products: ProductData[] = data?.products || []

  // Compute best values for highlighting
  const bestPrice = useMemo(() => {
    if (products.length === 0) return 0
    return Math.min(...products.map((p) => p.price))
  }, [products])

  const bestRating = useMemo(() => {
    if (products.length === 0) return 0
    return Math.max(...products.map((p) => p.rating))
  }, [products])

  const bestStock = useMemo(() => {
    if (products.length === 0) return 0
    return Math.max(...products.map((p) => p.stock))
  }, [products])

  const bestSoldCount = useMemo(() => {
    if (products.length === 0) return 0
    return Math.max(...products.map((p) => p.soldCount))
  }, [products])

  // Empty state — fewer than 2 products
  if (productIds.length < 2) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <GitCompareArrows className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Compare Products</h2>
          <p className="text-muted-foreground mb-6">
            Select at least 2 products to start comparing. You can add products from the shop or product pages.
          </p>
          <Button onClick={() => navigate('shop')} className="bg-foreground text-background hover:bg-foreground/90">
            Browse Products
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const attributes = [
    {
      label: 'Price',
      render: (p: ProductData) => (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-lg font-bold ${p.price === bestPrice ? 'text-emerald-600' : 'text-foreground'}`}>
            ${p.price.toFixed(2)}
          </span>
          {p.compareAtPrice && p.compareAtPrice > p.price && (
            <span className="text-sm text-muted-foreground line-through">${p.compareAtPrice.toFixed(2)}</span>
          )}
        </div>
      ),
    },
    {
      label: 'Rating',
      render: (p: ProductData) => (
        <div className="flex flex-col items-center gap-1">
          <RatingStars rating={p.rating} />
          <span className={`text-sm font-medium ${p.rating === bestRating ? 'text-emerald-600' : 'text-foreground'}`}>
            {p.rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">{p.reviewCount} reviews</span>
        </div>
      ),
    },
    {
      label: 'Brand',
      render: (p: ProductData) => (
        <span className="text-sm text-foreground font-medium">{p.brand || 'N/A'}</span>
      ),
    },
    {
      label: 'Stock',
      render: (p: ProductData) => (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-sm font-medium ${p.stock === bestStock ? 'text-emerald-600' : 'text-foreground'}`}>
            {p.stock > 10 ? 'In Stock' : p.stock > 0 ? `${p.stock} left` : 'Out of Stock'}
          </span>
          <span className="text-xs text-muted-foreground">{p.stock} units</span>
        </div>
      ),
    },
    {
      label: 'Category',
      render: (p: ProductData) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {p.category?.name || 'N/A'}
        </Badge>
      ),
    },
    {
      label: 'Popularity',
      render: (p: ProductData) => (
        <span className={`text-sm font-medium ${p.soldCount === bestSoldCount ? 'text-emerald-600' : 'text-foreground'}`}>
          {p.soldCount} sold
        </span>
      ),
    },
    {
      label: 'Description',
      render: (p: ProductData) => (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 text-left">
          {p.description || 'No description available'}
        </p>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compare Products</h1>
            <p className="text-sm text-muted-foreground">
              Comparing {products.length} of 4 products
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-destructive"
          onClick={clearComparison}
        >
          <X className="h-4 w-4" />
          Clear Comparison
        </Button>
      </div>

      {/* Product Headers */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `minmax(120px, 160px) repeat(${products.length}, minmax(0, 1fr))` }}>
        {/* Empty label cell */}
        <div />

        {/* Product columns */}
        {products.map((product) => (
          <Card key={product.id} className="bg-muted/50 border relative group">
            <button
              onClick={() => removeFromComparison(product.id)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
              title="Remove from comparison"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <button
                onClick={() => navigate('product', product.id)}
                className="mb-3"
              >
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden bg-background border border-border mx-auto mb-3 hover:scale-105 transition-transform">
                  <img
                    src={getFirstImage(product.images)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:underline">
                  {product.name}
                </h3>
              </button>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <Badge className="bg-red-600 text-white text-[10px] hover:bg-red-600 mb-1">
                  -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attributes Table */}
      <Card>
        <CardContent className="p-0">
          {attributes.map((attr, idx) => (
            <div key={attr.label}>
              <div
                className="grid gap-4 items-center min-h-[80px]"
                style={{ gridTemplateColumns: `minmax(120px, 160px) repeat(${products.length}, minmax(0, 1fr))` }}
              >
                {/* Label */}
                <div className="px-4 py-4 flex items-center">
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {attr.label}
                  </span>
                </div>

                {/* Values */}
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`px-4 py-4 flex items-center justify-center ${
                      idx < attributes.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    {attr.render(product)}
                  </div>
                ))}
              </div>
              {idx < attributes.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Slot indicators - show remaining slots */}
      {productIds.length < 4 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            You can add {4 - productIds.length} more product{4 - productIds.length > 1 ? 's' : ''} to compare.
          </p>
          <Button
            variant="link"
            className="text-sm mt-1"
            onClick={() => navigate('shop')}
          >
            Browse Products
          </Button>
        </div>
      )}
    </div>
  )
}