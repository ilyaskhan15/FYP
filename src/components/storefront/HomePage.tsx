'use client'

import { useQuery } from '@tanstack/react-query'
import { useNavigationStore } from '@/stores/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowRight,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Clock,
  Star,
  Quote,
  ChevronLeft,
} from 'lucide-react'
import ProductCard from './ProductCard'
import QuickViewModal from './QuickViewModal'
import { useEffect, useRef, useState, useCallback } from 'react'

/* ─── Scroll-reveal hook ─── */
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
              dir === 'left' ? 'animate-scroll-reveal-left' : dir === 'right' ? 'animate-scroll-reveal-right' : 'animate-scroll-reveal',
            )
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ─── Horizontal scroll hook ─── */
function useHorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll) }
  }, [checkScroll])
  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' })
  }, [])
  return { scrollRef, canScrollLeft, canScrollRight, scroll }
}

/* ─── Data ─── */
const testimonials = [
  { name: 'Sarah Mitchell', initials: 'SM', role: 'Interior Designer', rating: 5, quote: 'NOVA STORE has completely transformed how I furnish my projects. The quality is unmatched and delivery is always on time.' },
  { name: 'James Carter', initials: 'JC', role: 'Tech Enthusiast', rating: 5, quote: "I've been a loyal customer for over a year. Their electronics collection is curated with real care. Highly recommend!" },
  { name: 'Emily Zhang', initials: 'EZ', role: 'Fashion Blogger', rating: 4, quote: 'Amazing selection and the customer service is top-notch. Returns are hassle-free which gives me confidence to try new styles.' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={(i < rating) ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 fill-muted text-muted'} />
      ))}
    </div>
  )
}

function RecentlyViewed() {
  const { recentlyViewed, navigate } = useNavigationStore()
  if (recentlyViewed.length === 0) return null
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2.5 mb-6" data-reveal>
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Recently Viewed</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" data-reveal data-delay="100">
          {recentlyViewed.map((p) => (
            <button key={p.id} onClick={() => navigate('product', p.id)} className="group text-left">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-2">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">${p.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Main HomePage ─── */
export default function HomePage() {
  const { navigate, setShopFilters, resetShopFilters } = useNavigationStore()
  const revealRef = useScrollReveal()
  const [quickViewProduct, setQuickViewProduct] = useState<Parameters<typeof ProductCard>[0]['product'] | null>(null)
  const featuredScroll = useHorizontalScroll()
  const newScroll = useHorizontalScroll()

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
  const largeCategories = categories.slice(0, 2)
  const smallCategories = categories.slice(2, 6)

  return (
    <div ref={revealRef}>
      {/* ═══ HERO ═══ */}
      <section className="relative bg-zinc-950 dark:bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] hero-dot-grid"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/[0.07] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/[0.05] rounded-full blur-[100px]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="min-h-[520px] md:min-h-[620px] lg:min-h-[700px] grid lg:grid-cols-2 gap-8 items-center py-16 md:py-20 lg:py-0">
            <div className="max-w-xl">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2.5 bg-white/[0.08] border border-white/[0.12] rounded-full px-4 py-1.5 mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <span className="text-sm font-medium text-white/80 tracking-wide">New Season 2025</span>
                </div>
              </div>
              <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6" style={{ animationDelay: '100ms' }}>
                Redefine<br />
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">Your Style</span>
              </h1>
              <p className="animate-fade-in-up text-base md:text-lg text-white/50 mb-10 max-w-md leading-relaxed font-light" style={{ animationDelay: '200ms' }}>
                Curated collections of premium products designed for those who appreciate craftsmanship and modern aesthetics.
              </p>
              <div className="animate-fade-in-up flex flex-wrap gap-3" style={{ animationDelay: '300ms' }}>
                <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 h-12 rounded-full shadow-lg shadow-white/10 transition-all hover:shadow-white/20 hover:scale-[1.02]" onClick={() => { resetShopFilters(); navigate('shop') }}>
                  Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-medium text-base px-8 h-12 rounded-full transition-all" onClick={() => { setShopFilters({ sort: 'popular' }); navigate('shop') }}>
                  Best Sellers
                </Button>
              </div>
              <div className="animate-fade-in-up flex items-center gap-6 mt-12" style={{ animationDelay: '400ms' }}>
                {[{ value: '10K+', label: 'Customers' }, { value: '500+', label: 'Products' }, { value: '4.9', label: 'Rating' }].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative h-[500px] xl:h-[580px]">
              <div className="absolute top-4 right-0 w-[320px] xl:w-[360px] h-[400px] xl:h-[460px] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <img src="https://picsum.photos/seed/nova-hero-main/720/920" alt="Featured collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-white font-semibold text-lg drop-shadow-lg">The Essentials</p>
                  <p className="text-white/70 text-sm">Premium everyday carry</p>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-[200px] h-[240px] rounded-2xl overflow-hidden shadow-xl shadow-black/30 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <img src="https://picsum.photos/seed/nova-hero-float1/400/480" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 left-8 w-[180px] h-[180px] rounded-2xl overflow-hidden shadow-xl shadow-black/30 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <img src="https://picsum.photos/seed/nova-hero-float2/360/360" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-[45%] left-[30%] w-16 h-16 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <Sparkles className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="border-b border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders $75+' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '30-day policy' },
              { icon: Shield, title: 'Secure Payment', desc: 'SSL encrypted' },
              { icon: Sparkles, title: 'Premium Quality', desc: 'Handpicked' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 py-5 px-4 first:pl-0 last:pr-0">
                <div className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-foreground/70" /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY BENTO GRID ═══ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10" data-reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Browse</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Shop by Category</h2>
            </div>
            <Button variant="ghost" className="text-sm font-medium gap-1 text-muted-foreground hover:text-foreground" onClick={() => { resetShopFilters(); navigate('shop') }}>
              All Categories <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {catLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={(i < 2) ? 'aspect-[4/5] md:row-span-2 rounded-2xl' : 'aspect-[4/3] rounded-2xl'} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-reveal data-delay="100">
              {largeCategories.map((cat: Record<string, unknown>) => (
                <div key={cat.id} className="group relative rounded-2xl overflow-hidden cursor-pointer lg:row-span-2 aspect-[4/5] lg:aspect-auto" onClick={() => { resetShopFilters(); setShopFilters({ category: cat.slug as string }); navigate('shop') }}>
                  <img src={cat.image as string} alt={cat.name as string} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">{(cat._count as Record<string, number>)?.products || 0} products</p>
                    <h3 className="text-white font-bold text-xl md:text-2xl mb-3">{cat.name as string}</h3>
                    <span className="inline-flex items-center gap-1.5 text-white/80 text-sm font-medium group-hover:text-amber-400 transition-colors">Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </div>
              ))}
              {smallCategories.map((cat: Record<string, unknown>) => (
                <div key={cat.id} className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[4/3]" onClick={() => { resetShopFilters(); setShopFilters({ category: cat.slug as string }); navigate('shop') }}>
                  <img src={cat.image as string} alt={cat.name as string} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white/60 text-[11px] font-medium uppercase tracking-wider mb-0.5">{(cat._count as Record<string, number>)?.products || 0} products</p>
                    <h3 className="text-white font-semibold text-base">{cat.name as string}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS — Horizontal Scroll ═══ */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8" data-reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Curated</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Featured Products</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => featuredScroll.scroll('left')} disabled={!featuredScroll.canScrollLeft} className="h-9 w-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => featuredScroll.scroll('right')} disabled={!featuredScroll.canScrollRight} className="h-9 w-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3"><Skeleton className="aspect-square w-full rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
              ))}
            </div>
          ) : (
            <div ref={featuredScroll.scrollRef} className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-reveal data-delay="100">
              {featured.map((p: Record<string, unknown>) => (
                <div key={p.id} className="snap-start shrink-0 w-[260px] md:w-[280px]"><ProductCard product={p as Parameters<typeof ProductCard>[0]['product']} onQuickView={setQuickViewProduct} /></div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ EDITORIAL BANNER ═══ */}
      <section className="relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0">
          <img src="https://picsum.photos/seed/nova-editorial/1600/600" alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10" data-reveal>
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-4">Limited Edition</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">The Summer<br />Collection</h2>
            <p className="text-white/50 text-base md:text-lg leading-relaxed mb-8 max-w-md">Discover pieces that blend timeless design with contemporary flair. Limited stock available.</p>
            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 h-12 rounded-full shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:scale-[1.02]" onClick={() => { resetShopFilters(); navigate('shop') }}>
              Shop Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ NEW ARRIVALS — Horizontal Scroll ═══ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8" data-reveal>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Just Dropped</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">New Arrivals</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => newScroll.scroll('left')} disabled={!newScroll.canScrollLeft} className="h-9 w-9 rounded-full border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => newScroll.scroll('right')} disabled={!newScroll.canScrollRight} className="h-9 w-9 rounded-full border border-border bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          {newLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3"><Skeleton className="aspect-square w-full rounded-2xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
              ))}
            </div>
          ) : (
            <div ref={newScroll.scrollRef} className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-reveal data-delay="100">
              {newArrivals.map((p: Record<string, unknown>) => (
                <div key={p.id} className="snap-start shrink-0 w-[260px] md:w-[280px]"><ProductCard product={p as Parameters<typeof ProductCard>[0]['product']} onQuickView={setQuickViewProduct} /></div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Social Proof</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={t.name} data-reveal data-delay={String(i * 120)} className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow duration-300">
                <Quote className="h-7 w-7 text-amber-300/60 mb-5" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 min-h-[64px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-white text-sm font-bold shrink-0">{t.initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto"><StarRating rating={t.rating} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO CTA ═══ */}
      <section className="bg-background" data-reveal>
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="relative rounded-3xl bg-zinc-950 overflow-hidden p-8 md:p-12 lg:p-16">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/[0.08] rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/[0.06] rounded-full blur-[80px]"></div>
            <div className="absolute inset-0 opacity-[0.03] hero-dot-grid-sm"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.12] rounded-full px-3 py-1 mb-4">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-medium text-white/70">Limited Time</span>
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">Get 10% Off Your<br />First Order</h2>
                <p className="text-white/40 text-base max-w-md">Use code <span className="font-mono font-bold text-amber-400 bg-white/[0.08] px-2.5 py-1 rounded-md">WELCOME10</span> at checkout</p>
              </div>
              <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 h-12 rounded-full shadow-lg shadow-white/10 hover:shadow-white/20 shrink-0 transition-all hover:scale-[1.02]" onClick={() => { resetShopFilters(); navigate('shop') }}>
                Shop Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RecentlyViewed />
      <QuickViewModal product={quickViewProduct} open={!!quickViewProduct} onOpenChange={(open) => { if (!open) setQuickViewProduct(null) }} />
    </div>
  )
}
