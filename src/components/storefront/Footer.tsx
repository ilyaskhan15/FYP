'use client'

import { useNavigationStore } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Instagram,
  Youtube,
  Send,
  CheckCircle2,
  ArrowUp,
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

const footerLinks = {
  Shop: [
    { label: 'New Arrivals', action: () => { useNavigationStore.getState().setShopFilters({ isNew: true }); useNavigationStore.getState().navigate('shop') } },
    { label: 'Best Sellers', action: () => { useNavigationStore.getState().setShopFilters({ sort: 'popular' }); useNavigationStore.getState().navigate('shop') } },
    { label: 'All Products', action: () => { useNavigationStore.getState().resetShopFilters(); useNavigationStore.getState().navigate('shop') } },
    { label: 'Sale Items', action: () => { useNavigationStore.getState().setShopFilters({ sort: 'price_asc' }); useNavigationStore.getState().navigate('shop') } },
    { label: 'Gift Cards', action: () => {} },
  ],
  'Customer Service': [
    { label: 'Contact Us', action: () => {} },
    { label: 'Shipping & Returns', action: () => {} },
    { label: 'FAQ', action: () => {} },
    { label: 'Size Guide', action: () => {} },
    { label: 'Track Order', action: () => {} },
  ],
  Company: [
    { label: 'About Us', action: () => {} },
    { label: 'Careers', action: () => {} },
    { label: 'Press', action: () => {} },
    { label: 'Sustainability', action: () => {} },
    { label: 'Affiliate Program', action: () => {} },
  ],
  Legal: [
    { label: 'Privacy Policy', action: () => {} },
    { label: 'Terms of Service', action: () => {} },
    { label: 'Cookie Policy', action: () => {} },
    { label: 'Accessibility', action: () => {} },
  ],
}

const paymentMethods = [
  { name: 'Visa', abbr: 'VISA' },
  { name: 'Mastercard', abbr: 'MC' },
  { name: 'American Express', abbr: 'AMEX' },
  { name: 'PayPal', abbr: 'PP' },
  { name: 'Apple Pay', abbr: 'AP' },
  { name: 'Google Pay', abbr: 'GP' },
]

export default function Footer() {
  const { navigate } = useNavigationStore()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/newsletter')
      .then((r) => r.json())
      .then((data) => {
        const count = data.total ?? data.subscriberCount ?? null
        if (typeof count === 'number') {
          setSubscriberCount(count)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubscribed(true)
        setEmail('')
        toast.success(data.message || 'Subscribed successfully!')
        setTimeout(() => setSubscribed(false), 4000)
      } else {
        toast.error(data.error || 'Subscription failed')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email])

  return (
    <footer className="bg-zinc-950 text-zinc-300 mt-auto">
      {/* Gradient line above footer */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6 text-white" />
              <span className="text-xl font-bold text-white tracking-tight">NOVA STORE</span>
            </div>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs leading-relaxed">
              Curated premium products for the modern lifestyle. Quality, design, and value — delivered to your door.
            </p>
            <div className="flex items-center gap-2 mb-4 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>123 Commerce Blvd, San Francisco, CA 94102</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-transform">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-transform">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-transform">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:scale-110 transition-transform">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-zinc-400 hover:text-amber-400 transition-all duration-200 hover:translate-x-0.5"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <Separator className="my-8 bg-zinc-800" />
        <div
          className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-zinc-900 p-6 md:p-8 overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Send className="h-4 w-4 text-amber-400" />
                Stay in the loop
              </h3>
              {subscriberCount !== null && subscriberCount > 0 && (
                <p className="text-xs text-amber-400/70 mb-1">Join {subscriberCount.toLocaleString()}+ subscribers</p>
              )}
              <p className="text-sm text-zinc-400">
                Get exclusive deals, early access to new arrivals, and 10% off your first order.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:flex-initial md:w-64">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800/80 dark:bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-10 w-full pl-10 focus-visible:ring-amber-500/50"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || subscribed}
                className="h-10 shrink-0 bg-amber-500 text-white hover:bg-amber-600 font-semibold px-5 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Subscribing...
                  </span>
                ) : subscribed ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Done!
                  </span>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="my-8 bg-zinc-800" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} NOVA STORE. All rights reserved.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs text-zinc-500 hover:text-amber-400 transition-colors duration-200 flex items-center gap-1"
            >
              <ArrowUp className="h-3 w-3" />
              Back to top
            </button>
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {paymentMethods.map((pm) => (
              <div
                key={pm.name}
                className="h-7 px-2.5 rounded bg-zinc-800 border border-zinc-700/50 flex items-center justify-center"
                title={pm.name}
              >
                <span className="text-[10px] font-bold text-zinc-400 tracking-wide">{pm.abbr}</span>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> support@novastore.com
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> 1-800-NOVA
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}