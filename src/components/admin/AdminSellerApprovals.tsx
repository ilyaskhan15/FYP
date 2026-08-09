'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Store, Check, X, Clock, Loader2, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface SellerProfileRow {
  id: string
  storeName: string
  storeSlug: string
  description: string | null
  isApproved: boolean
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    isBanned: boolean
    createdAt: string
  }
  _count: { products: number }
}

export default function AdminSellerApprovals() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seller-approvals'],
    queryFn: () => fetch('/api/admin/seller-approvals').then(r => r.json()),
  })

  const profiles: SellerProfileRow[] = Array.isArray(data) ? data : []

  const filtered = profiles
    .filter(p => {
      if (filter === 'pending') return !p.isApproved
      if (filter === 'approved') return p.isApproved
      return true
    })
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.storeName.toLowerCase().includes(q) ||
        p.user.email.toLowerCase().includes(q) ||
        (p.user.name || '').toLowerCase().includes(q)
      )
    })

  const pendingCount = profiles.filter(p => !p.isApproved).length

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      fetch('/api/admin/seller-approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved }),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update') })
        return r.json()
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.isApproved ? 'Seller approved' : 'Seller rejected')
      queryClient.invalidateQueries({ queryKey: ['admin-seller-approvals'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Seller Accounts</h2>
          {pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sellers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'pending', 'approved'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${profiles.length})` : f === 'pending' ? `Pending (${pendingCount})` : `Approved (${profiles.length - pendingCount})`}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3" />
              <p className="text-sm">{search || filter !== 'all' ? 'No sellers match your filters' : 'No seller accounts yet'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(profile => (
                <div key={profile.id} className="px-4 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Store info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                        <Store className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{profile.storeName}</p>
                          <Badge
                            variant="outline"
                            className={profile.isApproved
                              ? 'border-green-300 text-green-700'
                              : 'border-amber-300 text-amber-700'
                            }
                          >
                            {profile.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                          {profile._count.products > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {profile._count.products} product{profile._count.products !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {profile.user.name || 'No name'} &middot; {profile.user.email}
                        </p>
                        {profile.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{profile.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">
                          Applied {formatDate(profile.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:ml-4">
                      {!profile.isApproved ? (
                        <>
                          <Button
                            size="sm"
                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveMutation.mutate({ id: profile.id, isApproved: true })}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            onClick={() => approveMutation.mutate({ id: profile.id, isApproved: false })}
                            disabled={approveMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700 border-amber-200"
                          onClick={() => approveMutation.mutate({ id: profile.id, isApproved: false })}
                          disabled={approveMutation.isPending}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
