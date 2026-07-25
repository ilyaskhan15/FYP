'use client'

import { useNavigationStore } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function OrderConfirmationPage() {
  const { navigate } = useNavigationStore()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600)
    return () => clearTimeout(timer)
  }, [])

  if (!showContent) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <div className="text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6" />
          <Skeleton className="h-8 w-56 mx-auto mb-3" />
          <Skeleton className="h-4 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-80 mx-auto mb-8" />
          <div className="bg-muted rounded-xl p-6 mb-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-32 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-3">Order Confirmed!</h1>
      <p className="text-muted-foreground mb-2">Thank you for your purchase.</p>
      <p className="text-sm text-muted-foreground mb-8">A confirmation email will be sent to your email address with order details and tracking information.</p>

      <div className="bg-muted rounded-xl p-6 mb-8 text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Order Number</span><span className="font-mono font-medium">ORD-{Date.now().toString(36).toUpperCase()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date().toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-green-600 font-medium">Confirmed</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Estimated Delivery</span><span className="font-medium">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('shop')}>
          Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate('account-orders')}>
          View Orders
        </Button>
      </div>
    </div>
  )
}