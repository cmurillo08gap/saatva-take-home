// Pure cart logic (no React). A line stores only a product id and a quantity;
// names, images and prices are always joined from the BFF product list.

export type CartLine = { productId: string; quantity: number }
export type Cart = { lines: CartLine[] }

export const CART_STORAGE_KEY = 'saatva.cart.v1'
export const MAX_QUANTITY_PER_LINE = 10

export const EMPTY_CART: Cart = { lines: [] }

export function parseCart(raw: string | null): Cart {
  if (!raw) return EMPTY_CART
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return EMPTY_CART
  }
  const lines = (data as { lines?: unknown } | null)?.lines
  if (!Array.isArray(lines)) return EMPTY_CART

  const merged = new Map<string, number>()
  for (const line of lines) {
    const { productId, quantity } = (line ?? {}) as Partial<CartLine>
    if (typeof productId !== 'string' || productId === '') continue
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) continue
    const clamped = Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(quantity)))
    merged.set(productId, Math.min(MAX_QUANTITY_PER_LINE, (merged.get(productId) ?? 0) + clamped))
  }
  if (merged.size === 0) return EMPTY_CART
  return { lines: [...merged].map(([productId, quantity]) => ({ productId, quantity })) }
}

export function serializeCart(cart: Cart): string {
  return JSON.stringify(cart)
}

/** Adds one unit. Returns the same cart reference when the line is already at the cap. */
export function addLine(cart: Cart, productId: string): { cart: Cart; added: boolean } {
  const existing = cart.lines.find((l) => l.productId === productId)
  if (!existing) {
    return { cart: { lines: [...cart.lines, { productId, quantity: 1 }] }, added: true }
  }
  if (existing.quantity >= MAX_QUANTITY_PER_LINE) return { cart, added: false }
  return {
    cart: {
      lines: cart.lines.map((l) =>
        l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    },
    added: true,
  }
}

/** Drops lines whose product is no longer sellable. Returns the same reference if nothing changed. */
export function pruneCart(cart: Cart, validIds: readonly string[]): Cart {
  const valid = new Set(validIds)
  const lines = cart.lines.filter((l) => valid.has(l.productId))
  return lines.length === cart.lines.length ? cart : { lines }
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0)
}

export function readCart(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Returns false when storage is unavailable or full (the caller keeps the cart in memory). */
export function writeCart(cart: Cart): boolean {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(cart))
    return true
  } catch (error) {
    console.warn('Cart could not be saved; keeping it in memory for this session.', error)
    return false
  }
}
