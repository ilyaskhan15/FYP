'use client'

import { useAuthStore } from '@/stores/auth'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Store, Save, CheckCircle, Clock } from 'lucide-react'

export default function SellerSettings() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState('')
  const [banner, setBanner] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const res = await fetch(`/api/seller/profile?userId=${user.id}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    enabled: !!user,
  })

  // Populate form fields from profile data once
  useEffect(() => {
    if (profile && !initialized) {
      setStoreName(profile.storeName || '')
      setDescription(profile.description || '')
      setLogo(profile.logo || '')
      setBanner(profile.banner || '')
      try {
        const bank = JSON.parse(profile.bankInfo || '{}')
        setBankName(bank.bankName || '')
        setAccountNumber(bank.accountNumber || '')
        setRoutingNumber(bank.routingNumber || '')
      } catch { /* ignore */ }
      setInitialized(true)
    }
  }, [profile, initialized])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      const res = await fetch(`/api/seller/profile?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          description,
          logo: logo || null,
          banner: banner || null,
          bankInfo: JSON.stringify({ bankName, accountNumber, routingNumber }),
        }),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Store settings saved')
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] })
    },
    onError: () => {
      toast.error('Failed to save settings')
    },
  })

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast.error('Store name is required')
      return
    }
    setIsSaving(true)
    try {
      await saveMutation.mutateAsync()
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Store Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your store profile and bank information</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.sellerProfile?.isApproved ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
          ) : (
            <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Store Information</CardTitle>
          <CardDescription>Basic information about your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name *</Label>
            <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Awesome Store" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Store Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your store..." rows={3} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner">Banner URL</Label>
              <Input id="banner" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://example.com/banner.png" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>Where you receive your earnings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Chase, Wells Fargo..." />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter account number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input id="routingNumber" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} placeholder="Enter routing number" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Your payment information is encrypted and secure. Commission rate: {profile?.commission ?? 10}%</p>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
