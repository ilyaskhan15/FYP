'use client'

import { useNavigationStore } from '@/stores/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/storefront/Header'
import Footer from '@/components/storefront/Footer'
import CartDrawer from '@/components/storefront/CartDrawer'
import CartSync from '@/components/storefront/CartSync'
import HomePage from '@/components/storefront/HomePage'
import ShopPage from '@/components/storefront/ShopPage'
import ProductPage from '@/components/storefront/ProductPage'
import CartPage from '@/components/storefront/CartPage'
import CheckoutPage from '@/components/storefront/CheckoutPage'
import SearchPage from '@/components/storefront/SearchPage'
import OrderConfirmationPage from '@/components/storefront/OrderConfirmationPage'
import ComparisonPage from '@/components/storefront/ComparisonPage'
import ComparisonBar from '@/components/storefront/ComparisonBar'
import AccountLayout from '@/components/account/AccountLayout'
import AccountProfile from '@/components/account/AccountProfile'
import AccountOrders from '@/components/account/AccountOrders'
import AccountAddresses from '@/components/account/AccountAddresses'
import AccountWishlist from '@/components/account/AccountWishlist'
import AccountReviews from '@/components/account/AccountReviews'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminProducts from '@/components/admin/AdminProducts'
import AdminCategories from '@/components/admin/AdminCategories'
import AdminReviews from '@/components/admin/AdminReviews'
import AdminOrders from '@/components/admin/AdminOrders'
import AdminCoupons from '@/components/admin/AdminCoupons'
import AdminUsers from '@/components/admin/AdminUsers'
import AdminSellerApprovals from '@/components/admin/AdminSellerApprovals'
import SellerLayout from '@/components/seller/SellerLayout'
import SellerDashboard from '@/components/seller/SellerDashboard'
import SellerProducts from '@/components/seller/SellerProducts'
import SellerOrders from '@/components/seller/SellerOrders'
import SellerSettings from '@/components/seller/SellerSettings'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─── Back To Top Button ─── */
function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible) return null

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg bg-foreground text-background hover:bg-foreground/90 animate-back-to-top"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}

function AppContent() {
  const { currentView } = useNavigationStore()

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomePage />
      case 'shop': return <ShopPage />
      case 'product': return <ProductPage />
      case 'cart': return <CartPage />
      case 'checkout': return <CheckoutPage />
      case 'search': return <SearchPage />
      case 'order-confirmation': return <OrderConfirmationPage />
      case 'compare': return <ComparisonPage />
      case 'account': return <AccountLayout><AccountProfile /></AccountLayout>
      case 'account-orders': return <AccountLayout><AccountOrders /></AccountLayout>
      case 'account-addresses': return <AccountLayout><AccountAddresses /></AccountLayout>
      case 'account-wishlist': return <AccountLayout><AccountWishlist /></AccountLayout>
      case 'account-reviews': return <AccountLayout><AccountReviews /></AccountLayout>
      case 'admin': return <AdminLayout><AdminDashboard /></AdminLayout>
      case 'admin-analytics': return <AdminLayout><AdminDashboard /></AdminLayout>
      case 'admin-products': return <AdminLayout><AdminProducts /></AdminLayout>
      case 'admin-categories': return <AdminLayout><AdminCategories /></AdminLayout>
      case 'admin-reviews': return <AdminLayout><AdminReviews /></AdminLayout>
      case 'admin-orders': return <AdminLayout><AdminOrders /></AdminLayout>
      case 'admin-coupons': return <AdminLayout><AdminCoupons /></AdminLayout>
      case 'admin-users': return <AdminLayout><AdminUsers /></AdminLayout>
      case 'admin-seller-approvals': return <AdminLayout><AdminSellerApprovals /></AdminLayout>
      // Seller views
      case 'seller': return <SellerLayout><SellerDashboard /></SellerLayout>
      case 'seller-products': return <SellerLayout><SellerProducts /></SellerLayout>
      case 'seller-orders': return <SellerLayout><SellerOrders /></SellerLayout>
      case 'seller-settings': return <SellerLayout><SellerSettings /></SellerLayout>
      default: return <HomePage />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CartSync />
      <Header />
      <main className="flex-1">
        <div key={currentView} className="animate-fade-in-up">
          {renderView()}
        </div>
      </main>
      <CartDrawer />
      <ComparisonBar />
      <Footer />
      <BackToTop />
    </div>
  )
}

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}