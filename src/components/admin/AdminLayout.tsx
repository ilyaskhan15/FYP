'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BarChart3, Package, ShoppingCart, Tag, Users, ArrowLeft, LogOut, Shield, FolderTree, MessageSquare } from 'lucide-react'

type AdminView = 'admin' | 'admin-analytics' | 'admin-products' | 'admin-categories' | 'admin-reviews' | 'admin-orders' | 'admin-coupons' | 'admin-users'

const navItems: { icon: typeof BarChart3; label: string; view: AdminView; badge?: string }[] = [
  { icon: BarChart3, label: 'Dashboard', view: 'admin' },
  { icon: Package, label: 'Products', view: 'admin-products', badge: 'CRUD' },
  { icon: FolderTree, label: 'Categories', view: 'admin-categories' },
  { icon: MessageSquare, label: 'Reviews', view: 'admin-reviews' },
  { icon: ShoppingCart, label: 'Orders', view: 'admin-orders' },
  { icon: Tag, label: 'Coupons', view: 'admin-coupons' },
  { icon: Users, label: 'Users', view: 'admin-users' },
]

interface Props { children: React.ReactNode }

export default function AdminLayout({ children }: Props) {
  const { currentView, navigate } = useNavigationStore()
  const { user, setUser, isAdmin } = useAuthStore()

  if (!user || !isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-sm mx-auto">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sign in with an admin account to access the dashboard.
          </p>
          <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => navigate('home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Store
          </Button>
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
              <Shield className="h-5 w-5 text-amber-500" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground text-xs">
              {(user.name || user.email || 'A')[0].toUpperCase()}
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
                    onClick={() => navigate(item.view)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-foreground text-background shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        active
                          ? 'bg-background/20 text-background'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              <Separator className="my-2" />
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