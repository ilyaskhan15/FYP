'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCartStore, type CartItem, type AppliedCoupon } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GUEST_CART_KEY = 'nova-cart:guest'
const SYNC_DEBOUNCE_MS = 500

interface StoredGuestCart {
  items: CartItem[]
  appliedCoupon: AppliedCoupon | null
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers (guest carts only)                            */
/* ------------------------------------------------------------------ */

function loadGuestCart(): StoredGuestCart | null {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveGuestCart(data: StoredGuestCart): void {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

// Clean up old per-user localStorage keys from the previous implementation
function cleanupLegacyKeys(): void {
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('nova-cart:') && key !== GUEST_CART_KEY) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    localStorage.removeItem('ecommerce-cart')
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

async function fetchDbCart(userId: string): Promise<CartItem[]> {
  const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

async function syncDbCart(userId: string, items: CartItem[]): Promise<void> {
  await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        quantity: i.quantity,
      })),
    }),
  })
}

/* ------------------------------------------------------------------ */
/*  CartSync Component                                                 */
/* ------------------------------------------------------------------ */

/**
 * CartSync handles user-specific cart persistence.
 *
 * - **Logged-in users**: cart is stored in the database (per user ID).
 * - **Guests (no user)**: cart is stored in localStorage under a single guest key.
 *
 * On login the guest cart is merged into the user's DB cart.
 * On logout the in-memory cart is cleared and the guest cart is restored.
 */
export default function CartSync() {
  const userId = useAuthStore((s) => s.user?.id)
  const prevUserIdRef = useRef<string | null | undefined>(undefined)
  const initializedRef = useRef(false)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // One-time cleanup of legacy localStorage keys
  useEffect(() => {
    cleanupLegacyKeys()
  }, [])

  // Load cart on mount
  useEffect(() => {
    const loadInitialCart = async () => {
      const { setItems, setAppliedCoupon } = useCartStore.getState()

      if (userId) {
        const dbItems = await fetchDbCart(userId)
        setItems(dbItems)
        setAppliedCoupon(null)
      } else {
        const stored = loadGuestCart()
        if (stored) {
          setItems(stored.items)
          setAppliedCoupon(stored.appliedCoupon)
        }
      }

      prevUserIdRef.current = userId
      initializedRef.current = true
    }

    loadInitialCart()
  }, [])

  // Handle user switching (login / logout)
  useEffect(() => {
    if (!initializedRef.current) return
    if (userId === prevUserIdRef.current) return

    const handleUserSwitch = async () => {
      const { items, appliedCoupon, setItems, setAppliedCoupon } = useCartStore.getState()
      const oldUserId = prevUserIdRef.current

      try {
        // --- SAVE old user's cart ---
        if (oldUserId) {
          await syncDbCart(oldUserId, items)
        } else {
          saveGuestCart({ items, appliedCoupon })
        }

        // --- LOAD new user's cart ---
        if (userId) {
          // Logging in → merge guest cart into DB cart
          const guestCart = loadGuestCart()
          const dbItems = await fetchDbCart(userId)

          // Merge: add guest items that aren't already in the DB cart
          const mergedItems = [...dbItems]
          for (const guestItem of guestCart?.items || []) {
            const existing = mergedItems.find(
              (d) =>
                d.productId === guestItem.productId &&
                d.variantId === guestItem.variantId
            )
            if (existing) {
              existing.quantity = Math.min(
                existing.quantity + guestItem.quantity,
                existing.stock
              )
            } else {
              mergedItems.push(guestItem)
            }
          }

          setItems(mergedItems)
          setAppliedCoupon(null)

          // Save merged cart to DB
          await syncDbCart(userId, mergedItems)

          // Clear guest cart from localStorage
          saveGuestCart({ items: [], appliedCoupon: null })
        } else {
          // Logging out → load guest cart from localStorage
          const guestCart = loadGuestCart()
          if (guestCart) {
            setItems(guestCart.items)
            setAppliedCoupon(guestCart.appliedCoupon)
          } else {
            setItems([])
            setAppliedCoupon(null)
          }
        }

        prevUserIdRef.current = userId
      } catch (err) {
        console.error('CartSync: user switch error', err)
        prevUserIdRef.current = userId
      }
    }

    handleUserSwitch()
  }, [userId])

  // Persist cart changes (debounced)
  const saveCurrentCart = useCallback(() => {
    const authUser = useAuthStore.getState().user?.id
    const { items, appliedCoupon } = useCartStore.getState()

    if (authUser) {
      syncDbCart(authUser, items).catch(() => { /* silent */ })
    } else {
      saveGuestCart({ items, appliedCoupon })
    }
  }, [])

  useEffect(() => {
    const unsub = useCartStore.subscribe((state) => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(saveCurrentCart, SYNC_DEBOUNCE_MS)
    })
    return () => {
      unsub()
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    }
  }, [saveCurrentCart])

  // Final sync on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      saveCurrentCart()
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [saveCurrentCart])

  return null
}
