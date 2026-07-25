'use client'

import { useNavigationStore, type ShopFilters } from '@/stores/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Star, X, SlidersHorizontal, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, SearchX, PackageSearch, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'

type ViewCols = 2 | 3 | 4

function FilterSidebar({ categories, brands, shopFilters, setShopFilters, resetShopFilters, onClose }: {
  categories: Record<string, unknown>[]
  brands: string[]
  shopFilters: ShopFilters
  setShopFilters: (f: Partial<ShopFilters>) => void
  resetShopFilters: () => void
  onClose?: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { resetShopFilters(); onClose?.() }}>
          Clear All
        </Button>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id as string} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={shopFilters.category === (cat.slug as string)}
                onCheckedChange={(checked) => { setShopFilters({ category: checked ? (cat.slug as string) : null, page: 1 }); onClose?.() }}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground data-[state=checked]:text-background"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{cat.name as string}</span>
              <span className="text-xs text-muted-foreground ml-auto">{(cat._count as Record<string, number>)?.products || 0}</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Price Range</h4>
        <Slider
          min={0} max={3000} step={10}
          value={[shopFilters.minPrice || 0, shopFilters.maxPrice || 3000]}
          onValueChange={([min, max]) => setShopFilters({ minPrice: min, maxPrice: max === 3000 ? null : max, page: 1 })}
          className="mt-2"
        />
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>${(shopFilters.minPrice || 0).toFixed(0)}</span>
          <span>${(shopFilters.maxPrice || 3000).toFixed(0)}</span>
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Brand</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.slice(0, 15).map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={shopFilters.brand === brand}
                onCheckedChange={(checked) => { setShopFilters({ brand: checked ? brand : null, page: 1 }); onClose?.() }}
                className="data-[state=checked]:bg-foreground data-[state=checked]:border-foreground data-[state=checked]:text-background"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{brand}</span>
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => { setShopFilters({ rating: shopFilters.rating === rating ? null : rating, page: 1 }); onClose?.() }}
              className="flex items-center gap-1.5 w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">& up</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer rounded-full border-0"
      onClick={onRemove}
    >
      {label}
      <X className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
    </Badge>
  )
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <PackageSearch className="h-12 w-12 text-muted-foreground" />
        </div>
        <SearchX className="h-8 w-8 text-muted absolute -top-1 -right-1" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">No products found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        We couldn&apos;t find any products matching your current filters. Try removing some filters or adjusting your search criteria.
      </p>
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="gap-2 px-6"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Clear All Filters
      </Button>
    </div>
  )
}

function ViewToggle({ value, onChange }: { value: ViewCols; onChange: (cols: ViewCols) => void }) {
  const options: { cols: ViewCols; icon: React.ReactNode; label: string }[] = [
    { cols: 2, icon: <LayoutList className="h-4 w-4" />, label: '2 columns' },
    { cols: 3, icon: <LayoutGrid className="h-4 w-4" />, label: '3 columns' },
    { cols: 4, icon: <LayoutGrid className="h-4 w-4" />, label: '4 columns' },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
        {options.map((opt, idx) => (
          <Tooltip key={opt.cols}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-none border-0 transition-all duration-150 ${idx < options.length - 1 ? 'border-r border-border' : ''} ${value === opt.cols ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                onClick={() => onChange(opt.cols)}
              >
                {opt.cols === 4 ? (
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="4.5" y="0.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="8.5" y="0.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="12.5" y="0.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="0.5" y="4.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="8.5" y="4.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="12.5" y="4.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="0.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="4.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="8.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="12.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="0.5" y="12.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="4.5" y="12.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="8.5" y="12.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="12.5" y="12.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                ) : opt.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{opt.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

export default function ShopPage() {
  const { shopFilters, setShopFilters, resetShopFilters } = useNavigationStore()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [viewCols, setViewCols] = useState<ViewCols>(3)
  const [quickViewProduct, setQuickViewProduct] = useState<Parameters<typeof ProductCard>[0]['product'] | null>(null)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (shopFilters.category) p.set('category', shopFilters.category)
    if (shopFilters.minPrice) p.set('minPrice', String(shopFilters.minPrice))
    if (shopFilters.maxPrice) p.set('maxPrice', String(shopFilters.maxPrice))
    if (shopFilters.brand) p.set('brand', shopFilters.brand)
    if (shopFilters.rating) p.set('rating', String(shopFilters.rating))
    if (shopFilters.sort) p.set('sort', shopFilters.sort)
    p.set('page', String(shopFilters.page))
    p.set('limit', String(shopFilters.limit))
    return p.toString()
  }, [shopFilters])

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryString],
    queryFn: () => fetch(`/api/products?${queryString}`).then((r) => r.json()),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  })

  const { data: allProductsData } = useQuery({
    queryKey: ['all-brands'],
    queryFn: () => fetch('/api/products?limit=100').then((r) => r.json()),
  })

  const categories = categoriesData || []
  const products = data?.products || []
  const pagination = data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 }

  const brands = useMemo(
    () => [...new Set((allProductsData?.products || []).map((p: { brand?: string }) => p.brand).filter(Boolean))] as string[],
    [allProductsData],
  )

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name-asc', label: 'Name: A-Z' },
  ]

  const hasActiveFilters = !!(shopFilters.category || shopFilters.brand || shopFilters.rating || shopFilters.minPrice || shopFilters.maxPrice)

  const activeFilterCount = [
    shopFilters.category,
    shopFilters.brand,
    shopFilters.rating,
    shopFilters.minPrice,
    shopFilters.maxPrice,
  ].filter(Boolean).length

  const getGridClass = () => {
    switch (viewCols) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2'
      case 3:
        return 'grid-cols-2 md:grid-cols-3'
      case 4:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      default:
        return 'grid-cols-2 md:grid-cols-3'
    }
  }

  const filterSidebarProps = { categories, brands, shopFilters, setShopFilters, resetShopFilters }

  const closeMobileFilters = () => setMobileFiltersOpen(false)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Shop</h1>
              <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
              </span>
            </div>
            {hasActiveFilters && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Filtered by {activeFilterCount} {activeFilterCount === 1 ? 'criteria' : 'criteria'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mobile filter button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden gap-2 flex-1 sm:flex-initial justify-center">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-0">
              <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <SheetHeader className="px-0">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </SheetTitle>
                </SheetHeader>
              </div>
              <div className="px-6 py-5">
                <FilterSidebar {...filterSidebarProps} onClose={closeMobileFilters} />
              </div>
              <SheetFooter className="border-t px-6 py-4 -mb-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { resetShopFilters(); closeMobileFilters() }}
                >
                  Clear All
                </Button>
                <Button
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                  onClick={closeMobileFilters}
                >
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Sort dropdown */}
          <Select value={shopFilters.sort} onValueChange={(v) => setShopFilters({ sort: v, page: 1 })}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle - only visible on sm+ */}
          <ViewToggle value={viewCols} onChange={setViewCols} />
        </div>
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-muted rounded-xl border border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Active:</span>
          {shopFilters.category && (
            <ActiveFilterChip
              label={`Category: ${categories.find((c) => c.slug === shopFilters.category)?.name || shopFilters.category}`}
              onRemove={() => setShopFilters({ category: null, page: 1 })}
            />
          )}
          {(shopFilters.minPrice || shopFilters.maxPrice) && (
            <ActiveFilterChip
              label={`Price: $${(shopFilters.minPrice || 0).toFixed(0)} – $${(shopFilters.maxPrice || 3000).toFixed(0)}`}
              onRemove={() => setShopFilters({ minPrice: null, maxPrice: null, page: 1 })}
            />
          )}
          {shopFilters.brand && (
            <ActiveFilterChip
              label={`Brand: ${shopFilters.brand}`}
              onRemove={() => setShopFilters({ brand: null, page: 1 })}
            />
          )}
          {shopFilters.rating && (
            <ActiveFilterChip
              label={`${shopFilters.rating}+ Stars`}
              onRemove={() => setShopFilters({ rating: null, page: 1 })}
            />
          )}
          <button
            onClick={resetShopFilters}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors font-medium whitespace-nowrap"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <FilterSidebar {...filterSidebarProps} />
          </div>
        </aside>

        {/* Product grid area */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={`grid gap-4 md:gap-6 ${getGridClass()}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState onClearFilters={resetShopFilters} />
          ) : (
            <>
              <div className={`grid gap-4 md:gap-6 ${getGridClass()}`}>
                {products.map((p: Record<string, unknown>, index: number) => (
                  <div
                    key={p.id}
                    className="animate-product-card"
                    style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
                  >
                    <ProductCard product={p as Parameters<typeof ProductCard>[0]['product']} onQuickView={setQuickViewProduct} />
                  </div>
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={pagination.page <= 1}
                    onClick={() => setShopFilters({ page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                    const pg = pagination.page <= 3 ? i + 1 : pagination.page + i - 2
                    if (pg > pagination.totalPages || pg < 1) return null
                    return (
                      <Button
                        key={pg}
                        variant={pg === pagination.page ? 'default' : 'outline'}
                        size="icon"
                        className={`h-9 w-9 ${pg === pagination.page ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`}
                        onClick={() => setShopFilters({ page: pg })}
                      >
                        {pg}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setShopFilters({ page: pagination.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => { if (!open) setQuickViewProduct(null) }}
      />
    </div>
  )
}