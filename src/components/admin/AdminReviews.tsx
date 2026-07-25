'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Trash2, Loader2, Star, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ReviewStatus = 'approved' | 'pending' | 'rejected'
type FilterTab = 'all' | 'approved' | 'pending' | 'rejected'

interface ReviewRow {
  id: string
  title: string | null
  comment: string
  rating: number
  status: string
  createdAt: string
  user: { id: string; name: string | null; email: string } | null
  product: { id: string; name: string; slug: string; images: string } | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
}

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

export default function AdminReviews() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search, activeTab],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (activeTab !== 'all') params.set('status', activeTab)
      return fetch(`/api/admin/reviews?${params.toString()}`).then(r => r.json())
    },
  })

  const reviews: ReviewRow[] = data?.reviews || []

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update review') })
        return r.json()
      }),
    onSuccess: (_, variables) => {
      toast.success(`Review ${variables.status}`)
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to delete review') })
        return r.json()
      }),
    onSuccess: () => {
      toast.success('Review deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSetStatus = useCallback((review: ReviewRow, status: ReviewStatus) => {
    statusMutation.mutate({ id: review.id, status })
  }, [statusMutation])

  const handleDelete = useCallback((review: ReviewRow) => {
    setDeleteTarget(review)
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Reviews ({data?.pagination?.total ?? reviews.length})</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product or reviewer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.value)}
            className={activeTab === tab.value ? 'bg-foreground text-background hover:bg-foreground/90' : ''}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p className="text-sm">No reviews found</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Reviewer</th>
                      <th className="px-4 py-3 font-medium">Rating</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium hidden xl:table-cell">Comment</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => {
                      const status = (review.status || 'pending') as ReviewStatus
                      const cfg = statusConfig[status] || statusConfig.pending
                      return (
                        <tr key={review.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium truncate max-w-40">{review.product?.name || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm truncate max-w-32">{review.user?.name || review.user?.email || 'Anonymous'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StarRating rating={review.rating} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm truncate max-w-40">{review.title || '—'}</p>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <p className="text-sm text-muted-foreground truncate max-w-60">{review.comment}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cfg.className}>
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            {formatDate(review.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {status !== 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                  onClick={() => handleSetStatus(review, 'approved')}
                                  disabled={statusMutation.isPending}
                                >
                                  Approve
                                </Button>
                              )}
                              {status !== 'rejected' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                  onClick={() => handleSetStatus(review, 'rejected')}
                                  disabled={statusMutation.isPending}
                                >
                                  Reject
                                </Button>
                              )}
                              {status !== 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                                  onClick={() => handleSetStatus(review, 'pending')}
                                  disabled={statusMutation.isPending}
                                >
                                  Pending
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDelete(review)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="lg:hidden divide-y">
                {reviews.map(review => {
                  const status = (review.status || 'pending') as ReviewStatus
                  const cfg = statusConfig[status] || statusConfig.pending
                  return (
                    <div key={review.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{review.product?.name || '—'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {review.user?.name || review.user?.email || 'Anonymous'} &middot; {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </div>

                      <StarRating rating={review.rating} />

                      {review.title && (
                        <p className="text-sm font-medium">{review.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-green-600 border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
                            onClick={() => handleSetStatus(review, 'approved')}
                            disabled={statusMutation.isPending}
                          >
                            Approve
                          </Button>
                        )}
                        {status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950"
                            onClick={() => handleSetStatus(review, 'rejected')}
                            disabled={statusMutation.isPending}
                          >
                            Reject
                          </Button>
                        )}
                        {status !== 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-zinc-600 border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
                            onClick={() => handleSetStatus(review, 'pending')}
                            disabled={statusMutation.isPending}
                          >
                            Pending
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-red-500 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                          onClick={() => handleDelete(review)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review by <strong>{deleteTarget?.user?.name || deleteTarget?.user?.email || 'Anonymous'}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
