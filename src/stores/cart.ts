import { create } from 'zustand'

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

export interface AppliedCoupon {
  code: string
  discount: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  appliedCoupon: AppliedCoupon | null
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setItems: (items: CartItem[]) => void
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void
  itemCount: () => number
  subtotal: () => number
  shipping: () => number
  tax: () => number
  discount: () => number
  total: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  isOpen: false,
  appliedCoupon: null,

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

  clearCart: () => set({ items: [], appliedCoupon: null }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  applyCoupon: (code, discount) => set({ appliedCoupon: { code, discount } }),
  removeCoupon: () => set({ appliedCoupon: null }),
  setItems: (items) => set({ items }),
  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  shipping: () => get().subtotal() > 75 ? 0 : 9.99,
  tax: () => get().subtotal() * 0.08,
  discount: () => get().appliedCoupon?.discount ?? 0,
  total: () => {
    const s = get()
    return Math.max(0, s.subtotal() + s.shipping() + s.tax() - s.discount())
  },
}))
