import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  variantId: string | null
  name: string
  image: string
  price: number
  compareAtPrice?: number
  variantName?: string
  quantity: number
  stock: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  itemCount: () => number
  subtotal: () => number
  shipping: () => number
  tax: () => number
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => set((state) => {
        const existingIndex = state.items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        )
        if (existingIndex > -1) {
          const newItems = [...state.items]
          const existing = newItems[existingIndex]
          newItems[existingIndex] = {
            ...existing,
            quantity: Math.min(existing.quantity + item.quantity, existing.stock),
          }
          return { items: newItems, isOpen: true }
        }
        return { items: [...state.items, { ...item, id: `${item.productId}-${item.variantId || 'default'}` }], isOpen: true }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i
        ),
      })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      shipping: () => get().subtotal() > 75 ? 0 : 9.99,
      tax: () => get().subtotal() * 0.08,
      total: () => {
        const s = get()
        return s.subtotal() + s.shipping() + s.tax()
      },
    }),
    {
      name: 'ecommerce-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)