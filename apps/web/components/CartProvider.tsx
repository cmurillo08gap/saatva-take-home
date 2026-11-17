'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { Product } from '@saatva/contracts'
import {
  CART_STORAGE_KEY,
  EMPTY_CART,
  addLine,
  cartCount,
  parseCart,
  pruneCart,
  removeLine,
  readCart,
  setLineQuantity,
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
  /** Drops lines for products no longer sold. Returns how many units (not lines) were removed. */
  prune: (validIds: readonly string[]) => number
  setQuantity: (productId: string, quantity: number) => void
  /** Returns false when the product wasn't in the cart. */
  removeItem: (productId: string) => boolean
  /** One-time message for this tab, e.g. after retired products were pruned. */
  notice: string | null
  dismissNotice: () => void
}

export function prunedNotice(removed: number): string {
  return removed === 1
    ? '1 item is no longer available and was removed from your cart.'
    : `${removed} items are no longer available and were removed from your cart.`
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

  // React state, not storage: only the tab that pruned shows the notice, and only once.
  const [notice, setNotice] = useState<string | null>(null)
  const dismissNotice = useCallback(() => setNotice(null), [])

  const prune = useCallback((validIds: readonly string[]) => {
    // An empty list means the catalog failed to load, not that every product is gone.
    if (validIds.length === 0) return 0
    const current = getSnapshot()
    const next = pruneCart(current, validIds)
    if (next === current) return 0
    commit(next)
    // Units, to match the header badge and the summary's "Items" count.
    const removed = cartCount(current) - cartCount(next)
    setNotice(prunedNotice(removed))
    return removed
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot()
    const next = setLineQuantity(current, productId, quantity)
    if (next !== current) commit(next)
  }, [])

  const removeItem = useCallback((productId: string) => {
    const current = getSnapshot()
    const next = removeLine(current, productId)
    if (next === current) return false
    commit(next)
    return true
  }, [])

  const value = useMemo(
    () => ({
      cart,
      count: cartCount(cart),
      hydrated,
      addItem,
      prune,
      setQuantity,
      removeItem,
      notice,
      dismissNotice,
    }),
    [cart, hydrated, addItem, prune, setQuantity, removeItem, notice, dismissNotice],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}

/** Drops cart lines for products that are no longer sellable, once the product list is known. */
export function usePruneCart(products: readonly Pick<Product, 'id'>[]) {
  const { prune } = useCart()
  useEffect(() => {
    prune(products.map((p) => p.id))
  }, [products, prune])
}
