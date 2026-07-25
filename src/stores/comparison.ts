import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_COMPARISON_ITEMS = 4

interface ComparisonState {
  productIds: string[]
  addToComparison: (productId: string) => boolean
  removeFromComparison: (productId: string) => void
  clearComparison: () => void
  isInComparison: (productId: string) => boolean
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      productIds: [],

      addToComparison: (productId) => {
        const current = get().productIds
        if (current.includes(productId)) return true
        if (current.length >= MAX_COMPARISON_ITEMS) return false
        set({ productIds: [...current, productId] })
        return true
      },

      removeFromComparison: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }))
      },

      clearComparison: () => set({ productIds: [] }),

      isInComparison: (productId) => {
        return get().productIds.includes(productId)
      },
    }),
    {
      name: 'nova-comparison',
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
)