'use client'

import { useNavigationStore, type ShopFilters } from '@/stores/navigation'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import {
  Search, ShoppingCart, User, Menu, Heart, Package, LayoutDashboard, LogOut,
  ChevronDown, ChevronRight, Store, Sun, Moon, Sparkles, TrendingUp, Tag, ArrowRight, Loader2, Clock, X,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  _count: { products: number }
}

interface SearchProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice: number | null
  images: string[]
  rating: number
  reviewCount: number
  brand: string
  stock: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Header() {
  const { navigate, currentView, setSearchQuery, searchQuery } = useNavigationStore()
  const { itemCount, openCart } = useCartStore()
  const { user, setUser, isAdmin } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  /* ---------- auth state ---------- */
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  /* ---------- mega menu state ---------- */
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [mobileShopOpen, setMobileShopOpen] = useState(false)
  const megaMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const megaMenuRef = useRef<HTMLDivElement>(null)

  /* ---------- search autocomplete state ---------- */
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchFormRef = useRef<HTMLFormElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  /* ---------- Load recent searches from localStorage ---------- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nova-recent-searches')
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
      const next = [trimmed, ...filtered].slice(0, 8)
      localStorage.setItem('nova-recent-searches', JSON.stringify(next))
      return next
    })
  }, [])

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== query)
      localStorage.setItem('nova-recent-searches', JSON.stringify(next))
      return next
    })
  }, [])

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('nova-recent-searches')
  }, [])

  const count = mounted ? itemCount() : 0

  /* ================================================================ */
  /*  Featured items for mega menu right column                        */
  /* ================================================================ */
  const featuredItems: Array<{ label: string; icon: typeof Sparkles; filter: Partial<ShopFilters> }> = [
    { label: 'New Arrivals', icon: Sparkles, filter: { sort: 'newest' } },
    { label: 'Best Sellers', icon: TrendingUp, filter: { sort: 'popular' } },
    { label: 'On Sale', icon: Tag, filter: { sort: 'price-asc' } },
  ]

  /* ================================================================ */
  /*  Navigation links (unchanged from original)                       */
  /* ================================================================ */
  const navLinks = [
    { label: 'Home', view: 'home' as const },
    { label: 'Shop', view: 'shop' as const },
    { label: 'New Arrivals', view: 'shop' as const, filter: { isNew: true } as Record<string, unknown> },
  ]

  /* ================================================================ */
  /*  Fetch categories once on mount                                   */
  /* ================================================================ */
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: Category[]) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(() => { /* silently fail */ })
  }, [])

  /* ================================================================ */
  /*  Debounced search autocomplete                                    */
  /* ================================================================ */
  useEffect(() => {
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current)

    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      setSearchOpen(false)
      return
    }

    searchDebounceTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
        const data = await res.json()
        if (Array.isArray(data.products)) {
          setSearchResults(data.products)
          setSearchOpen(true)
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current)
    }
  }, [searchQuery])

  /* ================================================================ */
  /*  Listen for open-auth-dialog event from other components          */
  /* ================================================================ */
  useEffect(() => {
    const handler = () => setAuthOpen(true)
    window.addEventListener('open-auth-dialog', handler)
    return () => window.removeEventListener('open-auth-dialog', handler)
  }, [])

  /* ================================================================ */
  /*  Close mega menu on view change & click outside                    */
  /* ================================================================ */
  useEffect(() => {
    setMegaMenuOpen(false)
    setSearchOpen(false)
  }, [currentView])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ================================================================ */
  /*  Handlers                                                          */
  /* ================================================================ */

  const openMegaMenu = useCallback(() => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current)
    setMegaMenuOpen(true)
  }, [])

  const scheduleCloseMegaMenu = useCallback(() => {
    megaMenuTimer.current = setTimeout(() => setMegaMenuOpen(false), 150)
  }, [])

  const navigateToShop = useCallback(
    (filters: Partial<ShopFilters>) => {
      useNavigationStore.getState().resetShopFilters()
      useNavigationStore.getState().setShopFilters(filters)
      navigate('shop')
      setMegaMenuOpen(false)
      setMobileOpen(false)
      setMobileShopOpen(false)
    },
    [navigate],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      saveRecentSearch(q)
      setSearchOpen(false)
      navigate('search')
    }
  }

  const handleSearchFocus = useCallback(() => {
    // Show recent searches when focused with empty query, or show autocomplete results
    if (searchQuery.trim() && searchResults.length > 0) {
      setSearchOpen(true)
    } else if (!searchQuery.trim() && recentSearches.length > 0) {
      setSearchOpen(true)
    }
  }, [searchQuery, searchResults, recentSearches])

  const handleSearchBlur = useCallback(() => {
    setTimeout(() => setSearchOpen(false), 200)
  }, [])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      searchRef.current?.blur()
    }
  }, [])

  const handleAuth = async () => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: authMode, email: authEmail, password: authPassword, name: authName }),
      })
      const data = await res.json()
      if (data.error) { setAuthError(data.error); return }
      setUser(data.user)
      setAuthOpen(false)
      setAuthEmail(''); setAuthPassword(''); setAuthName('')
    } catch { setAuthError('Something went wrong') }
    finally { setAuthLoading(false) }
  }

  const handleSignOut = () => { setUser(null) }

  /* ================================================================ */
  /*  Render                                                            */
  /* ================================================================ */
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top bar */}
        <div className="bg-zinc-900 text-white text-center text-xs py-1.5 px-4">
          <span className="font-medium">FREE SHIPPING</span> on orders over $75 &nbsp;|&nbsp; Use code <span className="font-bold">WELCOME10</span> for 10% off
        </div>

        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* ---- Mobile menu ---- */}
          <Sheet open={mobileOpen} onOpenChange={(open) => { setMobileOpen(open); if (!open) setMobileShopOpen(false) }}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="p-6 border-b">
                <div className="flex items-center gap-2" onClick={() => { navigate('home'); setMobileOpen(false) }}>
                  <Store className="h-6 w-6" />
                  <span className="text-xl font-bold tracking-tight">NOVA STORE</span>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {navLinks.map((link) =>
                  link.label === 'Shop' ? (
                    <div key="shop-mobile">
                      <button
                        onClick={() => setMobileShopOpen(!mobileShopOpen)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between',
                          currentView === 'shop' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        Shop
                        <ChevronRight className={cn('h-4 w-4 transition-transform duration-200', mobileShopOpen && 'rotate-90')} />
                      </button>

                      {mobileShopOpen && (
                        <div className="ml-3 mt-1 space-y-0.5">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => navigateToShop({ category: cat.slug })}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-between"
                            >
                              <span>{cat.name}</span>
                              <span className="text-xs opacity-50">{cat._count.products}</span>
                            </button>
                          ))}
                          <Separator className="my-2" />
                          {featuredItems.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => navigateToShop(item.filter)}
                              className="w-full text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2"
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              {item.label}
                            </button>
                          ))}
                          <button
                            onClick={() => navigateToShop({})}
                            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-muted transition-colors"
                          >
                            View All Products
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      key={link.label}
                      onClick={() => {
                        if (link.filter) { useNavigationStore.getState().setShopFilters(link.filter as Partial<ShopFilters>); navigate('shop') } else { navigate(link.view) }
                        setMobileOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                        currentView === link.view ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {link.label}
                    </button>
                  ),
                )}

                {user && (
                  <>
                    <div className="my-3 border-t" />
                    <button onClick={() => { navigate('account-orders'); setMobileOpen(false) }} className="w-full text-left px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-muted">My Orders</button>
                    <button onClick={() => { navigate('account-wishlist'); setMobileOpen(false) }} className="w-full text-left px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-muted">Wishlist</button>
                    {isAdmin() && (
                      <button onClick={() => { navigate('admin'); setMobileOpen(false) }} className="w-full text-left px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-muted font-medium">Admin Dashboard</button>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* ---- Logo ---- */}
          <button onClick={() => navigate('home')} className="flex items-center gap-2 shrink-0">
            <Store className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight hidden sm:inline">NOVA STORE</span>
          </button>

          {/* ---- Desktop Nav ---- */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.label === 'Shop' ? (
                /* ---- Mega Menu ---- */
                <div
                  key="shop-desktop"
                  ref={megaMenuRef}
                  onMouseEnter={openMegaMenu}
                  onMouseLeave={scheduleCloseMegaMenu}
                  className="relative"
                >
                  <button
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                      currentView === 'shop' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-expanded={megaMenuOpen}
                    aria-haspopup="true"
                    onClick={(e) => { e.stopPropagation(); navigate('shop') }}
                  >
                    Shop
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', megaMenuOpen && 'rotate-180')} />
                  </button>

                  {/* Dropdown panel */}
                  <div
                    className={cn(
                      'absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ease-out',
                      megaMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none',
                    )}
                    aria-hidden={!megaMenuOpen}
                  >
                    <div className="bg-card border rounded-xl shadow-lg p-6 min-w-[500px]">
                      <div className="grid grid-cols-[1fr_auto] gap-8">
                        {/* Left — Categories */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Categories</h3>
                          <div className="grid grid-cols-2 gap-0.5">
                            {categories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => navigateToShop({ category: cat.slug })}
                                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              >
                                <span>{cat.name}</span>
                                <span className="text-xs tabular-nums opacity-50">{cat._count.products}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right — Featured */}
                        <div className="border-l pl-6 min-w-[160px]">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Featured</h3>
                          <div className="space-y-0.5">
                            {featuredItems.map((item) => (
                              <button
                                key={item.label}
                                onClick={() => navigateToShop(item.filter)}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full text-left"
                              >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <button
                        onClick={() => navigateToShop({})}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View All Products <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.filter) { useNavigationStore.getState().setShopFilters(link.filter as Partial<ShopFilters>); navigate('shop') } else { navigate(link.view) }
                  }}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    currentView === link.view ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </button>
              ),
            )}
          </nav>

          {/* ---- Search (desktop) ---- */}
          <form ref={searchFormRef} onSubmit={handleSearch} className="w-48 focus-within:w-72 hidden md:flex relative transition-all duration-300">
            <div className="relative w-full transition-all duration-300">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search products..."
                className="pl-9 h-9 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                aria-expanded={searchOpen}
                aria-haspopup="listbox"
                role="combobox"
                aria-autocomplete="list"
              />

              {/* Search Autocomplete Dropdown */}
              <div
                className={cn(
                  'absolute top-full left-0 right-0 mt-1.5 bg-card border rounded-xl shadow-xl transition-all duration-200 ease-out z-50',
                  searchOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none',
                )}
              >
                {searchLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}

                {/* Recent Searches (shown when query is empty) */}
                {!searchLoading && !searchQuery.trim() && recentSearches.length > 0 && (
                  <div className="p-2">
                    <div className="flex items-center justify-between px-2.5 py-1.5">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Searches</span>
                    </div>
                    <ScrollArea className="max-h-64">
                      {recentSearches.map((term) => (
                        <div key={term} className="flex items-center group">
                          <button
                            onClick={() => {
                              setSearchQuery(term)
                              saveRecentSearch(term)
                              setSearchOpen(false)
                              navigate('search')
                            }}
                            className="flex-1 flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">{term}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRecentSearch(term)
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all shrink-0 mr-1"
                            aria-label={`Remove "${term}" from recent searches`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="border-t mt-1 pt-1">
                      <button
                        onClick={clearRecentSearches}
                        className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear Recent
                      </button>
                    </div>
                  </div>
                )}

                {!searchLoading && searchQuery.trim() && (
                  <ScrollArea className="max-h-80">
                    {searchResults.length > 0 ? (
                      <div className="p-2" role="listbox">
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              navigate('product', product.id)
                              setSearchOpen(false)
                            }}
                            className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                            role="option"
                            aria-selected={false}
                          >
                            {/* Thumbnail */}
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 border">
                              {product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate leading-tight">{product.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                                {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                                  <span className="text-xs text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}

                        {/* "View all results" footer */}
                        <button
                          onClick={() => {
                            setSearchOpen(false)
                            navigate('search')
                          }}
                          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-primary hover:bg-muted transition-colors border-t"
                        >
                          View all results for &ldquo;{searchQuery.trim()}&rdquo;
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No results found for &ldquo;{searchQuery.trim()}&rdquo;
                        </p>
                        <button
                          onClick={() => {
                            setSearchOpen(false)
                            navigate('search')
                          }}
                          className="flex items-center justify-center gap-2 mx-auto mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          View all results for &ldquo;{searchQuery.trim()}&rdquo;
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            </div>
          </form>

          {/* ---- Actions ---- */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { navigate('search') }}>
              <Search className="h-5 w-5" />
            </Button>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}
            {mounted && user && (
              <Button variant="ghost" size="icon" onClick={() => navigate('account-wishlist')}>
                <Heart className="h-5 w-5" />
              </Button>
            )}

            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1.5">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm max-w-24 truncate">{user.name || user.email}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('account')}>
                    <User className="mr-2 h-4 w-4" />My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('account-orders')}>
                    <Package className="mr-2 h-4 w-4" />My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('account-wishlist')}>
                    <Heart className="mr-2 h-4 w-4" />Wishlist
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('admin')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <Button variant="ghost" size="icon" onClick={() => setAuthOpen(true)}>
                <User className="h-5 w-5" />
              </Button>
            ) : null}

            <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-0">
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Dialog */}
      <Dialog open={authOpen} onOpenChange={(open) => { setAuthOpen(open); setAuthError('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</DialogTitle>
            <DialogDescription>
              {authMode === 'login' ? 'Sign in to your account' : 'Join NOVA STORE today'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {authMode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input id="auth-name" placeholder="Your name" value={authName} onChange={(e) => setAuthName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" type="email" placeholder="you@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" type="password" placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
            </div>
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            <Button className="w-full" onClick={handleAuth} disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }} className="text-foreground font-medium hover:underline">
                {authMode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
            <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-3">
              Demo: <strong>admin@store.com</strong> / <strong>admin123</strong> (Admin)<br />
              <strong>demo@store.com</strong> / <strong>demo123</strong> (Customer)
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}