import { create } from 'zustand'

export type ViewType =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'account-orders'
  | 'account-addresses'
  | 'account-wishlist'
  | 'account-reviews'
  | 'admin'
  | 'admin-products'
  | 'admin-categories'
  | 'admin-reviews'
  | 'admin-orders'
  | 'admin-coupons'
  | 'admin-users'
  | 'admin-analytics'
  | 'order-confirmation'
  | 'search'
  | 'compare'

interface NavigationState {
  currentView: ViewType
  selectedProductId: string | null
  searchQuery: string
  shopFilters: ShopFilters
  previousView: ViewType
  orderConfirmationId: string | null
  recentlyViewed: Array<{ id: string; name: string; image: string; price: number }>
  navigate: (view: ViewType, productId?: string) => void
  goBack: () => void
  setSearchQuery: (query: string) => void
  setShopFilters: (filters: Partial<ShopFilters>) => void
  resetShopFilters: () => void
  addRecentlyViewed: (product: { id: string; name: string; image: string; price: number }) => void
  setOrderConfirmationId: (id: string | null) => void
}

export interface ShopFilters {
  category: string | null
  minPrice: number | null
  maxPrice: number | null
  brand: string | null
  rating: number | null
  sort: string
  page: number
  limit: number
}

const defaultFilters: ShopFilters = {
  category: null,
  minPrice: null,
  maxPrice: null,
  brand: null,
  rating: null,
  sort: 'newest',
  page: 1,
  limit: 12,
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'home',
  selectedProductId: null,
  searchQuery: '',
  shopFilters: { ...defaultFilters },
  previousView: 'home',
  orderConfirmationId: null,
  recentlyViewed: [],
  navigate: (view, productId) => set((state) => ({
    previousView: state.currentView,
    currentView: view,
    selectedProductId: productId ?? null,
    orderConfirmationId: view === 'order-confirmation' ? (state.orderConfirmationId) : null,
  })),
  goBack: () => set((state) => ({
    currentView: state.previousView,
    previousView: state.currentView,
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShopFilters: (filters) => set((state) => ({
    shopFilters: { ...state.shopFilters, ...filters },
  })),
  resetShopFilters: () => set({ shopFilters: { ...defaultFilters } }),
  addRecentlyViewed: (product) => set((state) => ({
    recentlyViewed: [product, ...state.recentlyViewed.filter(p => p.id !== product.id)].slice(0, 10),
  })),
  setOrderConfirmationId: (id) => set({ orderConfirmationId: id }),
}))