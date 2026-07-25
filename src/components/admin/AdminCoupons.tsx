'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Tag, Copy, Check, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState, type FormEvent } from 'react'

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minOrderAmount: number
  maxUses: number | null
  usedCount: number
  isValid: boolean
  startsAt: string | null
  expiresAt: string | null
  createdAt: string
}

function formatType(c: Coupon): string {
  if (c.type === 'percentage') return `${c.value}%`
  if (c.type === 'fixed') return `$${c.value}`
  return 'Free Shipping'
}

export default function AdminCoupons() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => fetch('/api/coupons').then(r => r.json()),
  })
  const coupons: Coupon[] = data || []
  const [copied, setCopied] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState('fixed')
  const [formValue, setFormValue] = useState('')
  const [formMinOrder, setFormMinOrder] = useState('')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')

  const resetForm = () => {
    setFormCode('')
    setFormType('fixed')
    setFormValue('')
    setFormMinOrder('')
    setFormMaxUses('')
    setFormStartsAt('')
    setFormExpiresAt('')
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon created successfully')
      setCreateOpen(false)
      resetForm()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete coupon')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success('Coupon deleted')
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isValid }: { id: string; isValid: boolean }) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isValid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update coupon')
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      toast.success(variables.isValid ? 'Coupon activated' : 'Coupon deactivated')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      code: formCode.trim(),
      type: formType,
      value: parseFloat(formValue) || 0,
      minOrderAmount: parseFloat(formMinOrder) || 0,
      maxUses: formMaxUses ? parseInt(formMaxUses, 10) : null,
      startsAt: formStartsAt || null,
      expiresAt: formExpiresAt || null,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Coupons ({coupons.length})</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No coupons yet. Create your first coupon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-400" />
                    <span className="font-mono font-bold text-lg">{c.code}</span>
                  </div>
                  <button
                    onClick={() => copyCode(c.code)}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    {copied === c.code ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium capitalize">
                      {formatType(c)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min. Order</span>
                    <span className="font-medium">
                      {c.minOrderAmount ? `$${c.minOrderAmount.toFixed(2)}` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uses</span>
                    <span className="font-medium">
                      {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ' (unlimited)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={c.isValid ? 'default' : 'secondary'}
                      className={c.isValid ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                    >
                      {c.isValid ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({ id: c.id, isValid: !c.isValid })
                      }
                    >
                      {toggleMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : c.isValid ? (
                        <ToggleRight className="h-3 w-3" />
                      ) : (
                        <ToggleLeft className="h-3 w-3" />
                      )}
                      {c.isValid ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleteTarget(c)}
                    >
                      {deleteMutation.isPending && deleteTarget?.id === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Coupon Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Add a new discount coupon for your customers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g. SUMMER2025"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                required
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">3-20 characters, uppercase alphanumeric only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-type">Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="w-full" id="coupon-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formType !== 'free_shipping' && (
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  Value {formType === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min="0.01"
                  step={formType === 'percentage' ? '1' : '0.01'}
                  max={formType === 'percentage' ? '100' : undefined}
                  placeholder={formType === 'percentage' ? 'e.g. 15' : 'e.g. 10.00'}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="coupon-min-order">Min. Order Amount ($)</Label>
              <Input
                id="coupon-min-order"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-max-uses">Max Uses</Label>
              <Input
                id="coupon-max-uses"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave empty for unlimited uses</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-starts">Starts At</Label>
                <Input
                  id="coupon-starts"
                  type="date"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-expires">Expires At</Label>
                <Input
                  id="coupon-expires"
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCreateOpen(false); resetForm() }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon &quot;{deleteTarget?.code}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.code)
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
