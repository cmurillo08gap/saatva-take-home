'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import type { Product } from '@saatva/contracts'
import {
  CART_STORAGE_KEY,
  EMPTY_CART,
  addLine,
  cartCount,
  parseCart,
  pruneCart,
  readCart,
  writeCart,
  type Cart,
} from '@/lib/cart'

// A small external store over localStorage. React reads it with useSyncExternalStore, so the
// server snapshot (an empty cart) matches the first client render and nothing mismatches.

const listeners = new Set<() => void>()
// Set only when localStorage can't be written: the cart then lives in memory for the session.
let memoryRaw: string | undefined
let cachedRaw: string | null | undefined
let cachedCart: Cart = EMPTY_CART

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Fires in other tabs when they write the cart.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CART_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

// Returns the same object while the stored string is unchanged, as useSyncExternalStore requires.
function getSnapshot(): Cart {
  const raw = memoryRaw !== undefined ? memoryRaw : readCart()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedCart = parseCart(raw)
  }
  return cachedCart
}

function getServerSnapshot(): Cart {
  return EMPTY_CART
}

function commit(cart: Cart) {
  memoryRaw = writeCart(cart) ? undefined : JSON.stringify(cart)
  emit()
}

const subscribeNever = () => () => {}

type CartContextValue = {
  cart: Cart
  count: number
  /** False during server render and hydration; true once the real cart can be shown. */
  hydrated: boolean
  addItem: (product: Pick<Product, 'id'>) => 'added' | 'max'
  prune: (validIds: readonly string[]) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )

  const addItem = useCallback((product: Pick<Product, 'id'>) => {
    const result = addLine(getSnapshot(), product.id)
    if (!result.added) return 'max'
    commit(result.cart)
    return 'added'
  }, [])

  const prune = useCallback((validIds: readonly string[]) => {
    const current = getSnapshot()
    const next = pruneCart(current, validIds)
    if (next !== current) commit(next)
  }, [])

  const value = useMemo(
    () => ({ cart, count: cartCount(cart), hydrated, addItem, prune }),
    [cart, hydrated, addItem, prune],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}
