import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image?: string | null
  role: string
  sellerProfile?: {
    id: string
    storeName: string
    storeSlug: string
    isApproved: boolean
  } | null
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  isAdmin: () => boolean
  isSeller: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      isAdmin: () => get().user?.role === 'admin',
      isSeller: () => {
        const u = get().user
        return u?.role === 'seller' && !!u?.sellerProfile
      },
    }),
    {
      name: 'ecommerce-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
