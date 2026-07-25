'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Shield, ShieldOff, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()),
  })

  const users: Array<{
    id: string
    email: string
    name: string | null
    role: string
    isBanned: boolean
    createdAt: string
    _count: { orders: number; reviews: number; wishlist: number }
  }> = Array.isArray(data) ? data : []

  const filtered = search
    ? users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  const toggleBan = useMutation({
    mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
      fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isBanned }),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed to update user') })
        return r.json()
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.isBanned ? 'User banned' : 'User unbanned')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Users ({users.length})</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Orders</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Reviews</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Joined</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                            {(u.name || u.email.charAt(0)).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name || '—'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={u.role === 'admin' ? 'bg-zinc-900 text-white hover:bg-zinc-900' : ''}>
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u._count.orders}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u._count.reviews}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={u.isBanned ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'}>
                          {u.isBanned ? 'Banned' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 text-xs ${u.isBanned ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                            onClick={() => toggleBan.mutate({ id: u.id, isBanned: !u.isBanned })}
                            disabled={toggleBan.isPending}
                          >
                            {u.isBanned ? <><Shield className="h-3.5 w-3.5 mr-1" /> Unban</> : <><ShieldOff className="h-3.5 w-3.5 mr-1" /> Ban</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
