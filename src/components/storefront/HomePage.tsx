'use client'

import { useQuery } from '@tanstack/react-query'
import { useNavigationStore } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Clock,
  Users,
  Package,
  Award,
  Star,
  Quote,
  ChevronDown,
} from 'lucide-react'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'
import { useEffect, useRef, useCallback, useState } from 'react'

/* ─── Scroll-reveal hook (triggers CSS-only animations) ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = (entry.target as HTMLElement).dataset.revealDelay || '0'
            const dir = (entry.target as HTMLElement).dataset.reveal || 'up'
            ;(entry.target as HTMLElement).style.animationDelay = `${delay}ms`
            entry.target.classList.add(
              dir === 'left'
                ? 'animate-scroll-reveal-left'
                : dir === 'right'
                  ? 'animate-scroll-reveal-right'
                  : 'animate-scroll-reveal',
            )
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  return ref
}

/* ─── Testimonial Data ─── */
const testimonials = [
  {
    name: 'Sarah Mitchell',
    initials: 'SM',
    role: 'Interior Designer',
    rating: 5,
    quote:
      'NOVA STORE has completely transformed how I furnish my projects. The quality is unmatched and delivery is always on time.',
  },
  {
    name: 'James Carter',
    initials: 'JC',
    role: 'Tech Enthusiast',
    rating: 5,
    quote:
      "I've been a loyal customer for over a year now. Their electronics collection is curated with real care. Highly recommend!",
  },
  {
    name: 'Emily Zhang',
    initials: 'EZ',
    role: 'Fashion Blogger',
    rating: 4,
    quote:
      'Amazing selection and the customer service is top-notch. Returns are hassle-free which gives me confidence to try new styles.',
  },
]

/* ─── Stats Data ─── */
const stats = [
  { icon: Users, value: '10,000+', label: 'Happy Customers', color: 'text-amber-500' },
  { icon: Package, value: '500+', label: 'Products', color: 'text-emerald-500' },
  { icon: Award, value: '50+', label: 'Brands', color: 'text-violet-500' },
  { icon: Star, value: '4.9', label: 'Average Rating', color: 'text-orange-500' },
]

/* ─── Brand Names (text-based marquee) ─── */
const brands = [
  'TechPro', 'UrbanCraft', 'EcoLiving', 'StyleHub', 'PureDesign',
  'NovaElite', 'Forma', 'Aether', 'LuxeLine', 'Modo',
  'Kinto', 'PeakGear', 'Sakura', 'NordicHome',
]

/* ─── Recently Viewed ─── */
function RecentlyViewed() {
  const { recentlyViewed, navigate } = useNavigationStore()
  if (recentlyViewed.length === 0) return null
  return (
    <section className="py-10 md:py-14 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Recently Viewed</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recentlyViewed.map((p) => (
            <button key={p.id} onClick={() => navigate('product', p.id)} className="group text-left">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2 ring-1 ring-border">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs font-semibold text-muted-foreground">${p.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Star Rating Component ─── */
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  )
}

/* ─── TypeWriter Component ─── */
function TypeWriter({ text, delay = 30 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!started) return
    if (displayed.length >= text.length) return
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev.length >= text.length) {
          clearInterval(interval)
          return prev
        }
        return text.slice(0, prev.length + 1)
      })
    }, delay)
    return () => clearInterval(interval)
  }, [started, displayed, text, delay])

  return (
    <span className="inline">
      <span>{displayed}</span>
      {displayed.length < text.length && (
        <span className="animate-typewriter-cursor">&nbsp;</span>
      )}
    </span>
  )
}

/* ─── Main HomePage ─── */
export default function HomePage() {
  const { navigate, setShopFilters, resetShopFilters } = useNavigationStore()
  const revealRef = useScrollReveal()
  const [quickViewProduct, setQuickViewProduct] = useState<Parameters<typeof ProductCard>[0]['product'] | null>(null)

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetch('/api/products?featured=true&limit=8').then((r) => r.json()),
  })

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  })

  const { data: newArrivalsData, isLoading: newLoading } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => fetch('/api/products?new=true&limit=8').then((r) => r.json()),
  })

  const featured = featuredData?.products || []
  const categories = categoriesData || []
  const newArrivals = newArrivalsData?.products || []

  return (
    <div ref={revealRef}>
      {/* ══════════ Hero Section — Animated Gradient ══════════ */}
      <section className="relative overflow-hidden text-white min-h-[480px] md:min-h-[560px] lg:min-h-[640px]">
        {/* Animated gradient background (no image dependency) */}
        <div className="absolute inset-0 animate-hero-gradient bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />

        {/* Decorative floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-10 right-20 w-96 h-96 bg-amber-400/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Animated particle/dot grid background (CSS-only) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 animate-float"
            style={{
              animationDuration: '12s',
              backgroundImage: 'radial-gradient(rgba(245,158,11,0.08) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            className="absolute inset-0 animate-float"
            style={{
              animationDuration: '18s',
              animationDelay: '3s',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              backgroundPosition: '16px 16px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6 shimmer-overlay overflow-hidden">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-sm font-medium text-white/90">New Season Collection 2025</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 text-white drop-shadow-2xl text-shadow-md">
              Discover
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Premium Products
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
              <TypeWriter text="Curated selection of the finest products. Quality craftsmanship meets modern design." />
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 h-12 shadow-lg"
                onClick={() => {
                  resetShopFilters()
                  navigate('shop')
                }}
              >
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-medium text-base px-8 h-12"
                onClick={() => {
                  setShopFilters({ sort: 'popular' })
                  navigate('shop')
                }}
              >
                Best Sellers
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce-subtle z-10">
          <span className="text-xs text-white/40 tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-5 w-5 text-white/40" />
        </div>
      </section>

      {/* ══════════ Trust Badges ══════════ */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Shield, title: 'Secure Payment', desc: '256-bit SSL encryption' },
              { icon: Sparkles, title: 'Premium Quality', desc: 'Handpicked products' },
            ].map((item) => (
              <div
                key={item.title}
                data-reveal
                data-reveal-delay="0"
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Animated Stats Section ══════════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                data-reveal
                data-reveal-delay={String(i * 120)}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-muted group-hover:bg-muted/80 transition-colors mb-3 animate-stat-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Featured Products ══════════ */}
      <section className="py-12 md:py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div
            className="flex items-end justify-between mb-8"
            data-reveal
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Handpicked favorites just for you</p>
            </div>
            <Button
              variant="ghost"
              className="text-sm font-medium gap-1"
              onClick={() => {
                resetShopFilters()
                navigate('shop')
              }}
            >
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.map((p: Record<string, unknown>) => (
                <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ Categories ══════════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8" data-reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Find exactly what you&apos;re looking for</p>
          </div>
          {catLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat: Record<string, unknown>, i: number) => (
                <Card
                  key={cat.id}
                  data-reveal
                  data-reveal-delay={String(i * 80)}
                  className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover-lift"
                  onClick={() => {
                    resetShopFilters()
                    setShopFilters({ category: cat.slug as string })
                    navigate('shop')
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={cat.image as string}
                      alt={cat.name as string}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-lg">{cat.name as string}</h3>
                      <p className="text-white/70 text-sm">{(cat._count as Record<string, number>)?.products || 0} products</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ Brand Logos Marquee ══════════ */}
      <section className="py-10 md:py-14 bg-muted border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 mb-6 text-center" data-reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trusted by leading brands</p>
        </div>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted to-transparent z-10 pointer-events-none" />

          <div className="flex overflow-hidden">
            <div className="flex gap-10 md:gap-16 items-center animate-marquee whitespace-nowrap">
              {/* Duplicate for seamless loop */}
              {[...brands, ...brands].map((brand, i) => (
                <span
                  key={`${brand}-${i}`}
                  className="text-lg md:text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors select-none tracking-tight"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ New Arrivals ══════════ */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div
            className="flex items-end justify-between mb-8"
            data-reveal
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">New Arrivals</h2>
              <p className="text-muted-foreground mt-1">Fresh drops you don&apos;t want to miss</p>
            </div>
            <Button
              variant="ghost"
              className="text-sm font-medium gap-1"
              onClick={() => {
                resetShopFilters()
                setShopFilters({ sort: 'newest' })
                navigate('shop')
              }}
            >
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {newLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.slice(0, 8).map((p: Record<string, unknown>) => (
                <ProductCard key={p.id} product={p as Parameters<typeof ProductCard>[0]['product']} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ Testimonials Section ══════════ */}
      <section className="py-14 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10" data-reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What Our Customers Say</h2>
            <p className="text-muted-foreground mt-1">Real reviews from real people</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card
                key={t.name}
                data-reveal
                data-reveal-delay={String(i * 150)}
                className="relative border border-border shadow-sm hover:shadow-md transition-shadow duration-300 bg-card"
              >
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-amber-200 mb-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 min-h-[60px]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <StarRating rating={t.rating} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Recently Viewed ══════════ */}
      <RecentlyViewed />

      {/* ══════════ Promo Banner — Enhanced ══════════ */}
      <section className="relative overflow-hidden bg-zinc-900 dark:bg-zinc-950 text-white">
        {/* Subtle diagonal pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.5) 35px, rgba(255,255,255,0.5) 36px)',
          }}
        />
        {/* Gradient glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-500/8 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-6"
            data-reveal
          >
            <div className="text-center md:text-left">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 mb-4">
                <Sparkles className="h-3 w-3 mr-1" /> Limited Time
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Free Shipping on Orders Over $75
              </h2>
              <p className="text-zinc-400 text-lg">
                Use code{' '}
                <span className="font-mono font-bold text-amber-400 bg-white/10 px-2.5 py-1 rounded-md">
                  WELCOME10
                </span>{' '}
                for 10% off your first order
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 h-12 shrink-0"
              onClick={() => {
                resetShopFilters()
                navigate('shop')
              }}
            >
              Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════ Quick View Modal ══════════ */}
      <QuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onOpenChange={(open) => { if (!open) setQuickViewProduct(null) }}
      />
    </div>
  )
}