'use client'

import { useNavigationStore, type ViewType } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BarChart3, Package, ShoppingCart, Settings, ArrowLeft, Store, Clock, LogOut } from 'lucide-react'

type SellerView = 'seller' | 'seller-products' | 'seller-orders' | 'seller-settings'

const navItems: { icon: typeof BarChart3; label: string; view: SellerView }[] = [
  { icon: BarChart3, label: 'Dashboard', view: 'seller' },
  { icon: Package, label: 'My Products', view: 'seller-products' },
  { icon: ShoppingCart, label: 'Orders', view: 'seller-orders' },
  { icon: Settings, label: 'Store Settings', view: 'seller-settings' },
]

interface Props { children: React.ReactNode }

export default function SellerLayout({ children }: Props) {
  const { currentView, navigate } = useNavigationStore()
  const { user, setUser, isSeller } = useAuthStore()

  // Fetch full seller profile for banner/logo display
  const { data: profile } = useQuery({
    queryKey: ['seller-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const res = await fetch(`/api/seller/profile?userId=${user.id}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!user && isSeller() && !!user.sellerProfile?.isApproved,
  })

  // Not logged in or not a seller
  if (!user || !isSeller()) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-sm mx-auto">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Seller Access Required</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sign in with a seller account to access your dashboard.
          </p>
          <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Store
          </Button>
        </div>
      </div>
    )
  }

  // Seller but not approved
  if (user.sellerProfile && !user.sellerProfile.isApproved) {
    return (
      <div className="min-h-[calc(100vh-8rem)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Store
              </button>
              <Separator orientation="vertical" className="h-5" />
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-amber-500" />
                <h1 className="text-2xl font-bold">Seller Center</h1>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              Your seller account for <strong>{user.sellerProfile.storeName}</strong> is currently under review.
            </p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll notify you once your account has been approved. This usually takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 py-8">
        {/* Back link + Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Store
            </button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-500" />
              <h1 className="text-2xl font-bold">Seller Center</h1>
              {user.sellerProfile && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {user.sellerProfile.storeName}
                </Badge>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground text-xs">
              {(user.name || user.email || 'S')[0].toUpperCase()}
            </div>
            <span className="font-medium">{user.name || user.email}</span>
          </div>
        </div>

        {/* Store Banner — YouTube-style layout */}
        <div className="mb-8 rounded-xl border bg-card">
          {profile?.banner ? (
            <>
              {/* Banner image — rounded top, clipped */}
              <div className="rounded-t-xl h-36 sm:h-48 w-full overflow-hidden">
                <img
                  src={profile.banner}
                  alt="Store banner"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Info row below banner — logo overlaps bottom edge */}
              <div className="relative px-4 sm:px-6 pt-2 pb-4 flex items-end gap-4">
                {profile.logo ? (
                  <div className="-mt-10 sm:-mt-12 shrink-0">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 border-card bg-card shadow-md overflow-hidden">
                      <img src={profile.logo} alt="Store logo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <div className="-mt-10 sm:-mt-12 shrink-0">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 border-card bg-muted flex items-center justify-center shadow-md">
                      <Store className="h-7 w-7 sm:h-9 sm:w-9 text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div className="min-w-0 pb-0.5">
                  <h2 className="font-bold text-lg sm:text-xl truncate">{profile.storeName}</h2>
                  {profile.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{profile.description}</p>
                  )}
                </div>
              </div>
            </>
          ) : profile?.logo ? (
            <div className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 rounded-xl border bg-muted overflow-hidden shrink-0">
                <img src={profile.logo} alt="Store logo" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg truncate">{profile.storeName}</h2>
                {profile.description && (
                  <p className="text-sm text-muted-foreground truncate">{profile.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => navigate('seller-settings')}
              >
                Add Banner
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="font-bold text-lg">{user.sellerProfile?.storeName || 'My Store'}</h2>
                <p className="text-sm text-muted-foreground">Customize your store with a logo and banner</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('seller-settings')}
              >
                Customize
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-card border rounded-xl p-2 space-y-1 sticky top-24">
              {navItems.map(item => {
                const active = currentView === item.view
                return (
                  <button
                    key={item.view}
                    onClick={() => navigate(item.view as ViewType)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                )
              })}
              <Separator className="my-2" />
              <button
                onClick={() => navigate('home')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Shopping
              </button>
              <button
                onClick={() => setUser(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-4 animate-fade-in-up">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
