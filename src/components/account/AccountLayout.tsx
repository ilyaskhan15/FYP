'use client'

import { useNavigationStore } from '@/stores/navigation'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, Package, MapPin, Heart, Star, ArrowLeft, LogOut, Store, Crown } from 'lucide-react'

type AccountView = 'account' | 'account-orders' | 'account-addresses' | 'account-wishlist' | 'account-reviews'

const navItems: { icon: typeof User; label: string; view: AccountView }[] = [
  { icon: User, label: 'Profile', view: 'account' },
  { icon: Package, label: 'Orders', view: 'account-orders' },
  { icon: MapPin, label: 'Addresses', view: 'account-addresses' },
  { icon: Heart, label: 'Wishlist', view: 'account-wishlist' },
  { icon: Star, label: 'Reviews', view: 'account-reviews' },
]

interface Props { children: React.ReactNode }

export default function AccountLayout({ children }: Props) {
  const { currentView, navigate } = useNavigationStore()
  const { user, setUser } = useAuthStore()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Please sign in</h2>
        <p className="text-muted-foreground mb-4">You need to be signed in to access your account.</p>
        <Button className="bg-zinc-900 hover:bg-zinc-800" onClick={() => navigate('home')}>Go Home</Button>
      </div>
    )
  }

  const isSeller = user.role === 'seller'
  const isAdmin = user.role === 'admin'

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate('home')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">My Account</h1>
        <Badge variant="secondary" className="text-xs capitalize">{user.role}</Badge>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <div className="bg-muted rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === item.view ? 'bg-zinc-900 text-white' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <item.icon className="h-4 w-4" />{item.label}
              </button>
            ))}

            {/* Seller section */}
            {isSeller && (
              <>
                <Separator className="my-2" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Seller</p>
                <button
                  onClick={() => navigate('seller')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Store className="h-4 w-4" />Seller Dashboard
                </button>
              </>
            )}

            {/* Become a Seller (for buyers only) */}
            {!isSeller && !isAdmin && (
              <>
                <Separator className="my-2" />
                <button
                  onClick={() => window.dispatchEvent(new Event('open-become-seller'))}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                >
                  <Crown className="h-4 w-4" />Become a Seller
                </button>
              </>
            )}

            <Separator className="my-2" />
            <button onClick={() => setUser(null)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
              <LogOut className="h-4 w-4" />Sign Out
            </button>
          </nav>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  )
}