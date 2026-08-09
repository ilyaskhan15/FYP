'use client'

import { useNavigationStore, type ViewType } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
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
