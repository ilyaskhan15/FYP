'use client'

import { useComparisonStore } from '@/stores/comparison'
import { useNavigationStore } from '@/stores/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { X, GitCompareArrows, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

export default function ComparisonBar() {
  const { productIds, clearComparison, removeFromComparison } = useComparisonStore()
  const { navigate, currentView } = useNavigationStore()

  const ids = useMemo(() => productIds.join(','), [productIds])

  const { data } = useQuery({
    queryKey: ['comparison-bar', ids],
    queryFn: () => fetch(`/api/products?id=${ids}`).then((r) => r.json()),
    enabled: productIds.length >= 2,
  })

  const products = data?.products || []

  // Don't show the bar when already on the compare page
  if (productIds.length < 2 || currentView === 'compare') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
      <div className="border-t bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          {/* Thumbnails */}
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            {products.map((p: Record<string, unknown>) => {
              const imgs: string[] = (() => {
                try { return JSON.parse((p.images as string) || '[]') }
                catch { return [] }
              })()
              return (
                <button
                  key={p.id}
                  onClick={() => removeFromComparison(p.id as string)}
                  className="relative shrink-0 group/thumb"
                  title={`Remove ${p.name}`}
                >
                  <div className="h-10 w-10 rounded-lg overflow-hidden border-2 border-border group-hover/thumb:border-foreground transition-colors">
                    <img
                      src={imgs[0] || '/placeholder.png'}
                      alt={p.name as string}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    <X className="h-2.5 w-2.5" />
                  </span>
                </button>
              )
            })}
          </div>

          {/* Product count label */}
          <span className="text-sm text-muted-foreground hidden sm:inline shrink-0">
            {productIds.length} product{productIds.length > 1 ? 's' : ''} selected
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate('compare')}
            >
              <GitCompareArrows className="h-4 w-4" />
              <span>Compare ({productIds.length})</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={clearComparison}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}