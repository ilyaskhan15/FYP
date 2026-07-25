'use client'

import { useAuthStore } from '@/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { Star, MessageSquare, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigationStore } from '@/stores/navigation'

export default function AccountReviews() {
  const { user } = useAuthStore()
  const { navigate } = useNavigationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: () => fetch(`/api/reviews?userId=${user!.id}`).then(r => r.json()),
    enabled: !!user?.id,
  })

  const reviews: Array<{
    id: string
    rating: number
    title: string | null
    comment: string | null
    status: string
    createdAt: string
    product: { id: string; name: string; images: string } | null
  }> = Array.isArray(data) ? data : []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-xl">
        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">You haven&apos;t written any reviews yet</p>
        <p className="text-xs text-muted-foreground mb-4">Purchase products and share your experience!</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('shop')}>
          Browse Products <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">My Reviews ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map(review => {
          const images = review.product?.images ? JSON.parse(review.product.images) : []
          return (
            <div key={review.id} className="border rounded-xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-4">
                {images.length > 0 && (
                  <button
                    onClick={() => navigate('product', review.product!.id)}
                    className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border"
                  >
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <button
                        onClick={() => navigate('product', review.product!.id)}
                        className="font-medium text-sm hover:underline text-left"
                      >
                        {review.product?.name || 'Unknown Product'}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`} />
                          ))}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${review.status === 'approved' ? 'border-green-300 text-green-700' : review.status === 'rejected' ? 'border-red-300 text-red-700' : 'border-amber-300 text-amber-700'}`}
                        >
                          {review.status === 'approved' ? 'Approved' : review.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {review.title && <p className="font-medium text-sm mt-1">{review.title}</p>}
                  {review.comment && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{review.comment}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
