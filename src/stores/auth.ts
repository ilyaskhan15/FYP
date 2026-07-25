import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  image?: string | null
  role: string
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'ecommerce-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)