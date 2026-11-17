import type { Product } from '@saatva/contracts'

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

/** Sets a line's quantity (clamped to 1–max). Returns the same reference when nothing changes. */
export function setLineQuantity(cart: Cart, productId: string, quantity: number): Cart {
  const clamped = Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(quantity)))
  const existing = cart.lines.find((l) => l.productId === productId)
  if (!existing || existing.quantity === clamped) return cart
  return {
    lines: cart.lines.map((l) => (l.productId === productId ? { ...l, quantity: clamped } : l)),
  }
}

/** Removes a line. Returns the same reference when the product isn't in the cart. */
export function removeLine(cart: Cart, productId: string): Cart {
  const lines = cart.lines.filter((l) => l.productId !== productId)
  return lines.length === cart.lines.length ? cart : { lines }
}

export type PricedLine = { product: Product; quantity: number; lineTotalCents: number }
export type PricedCart = {
  lines: PricedLine[]
  subtotalCents: number
  /** Total units across the priced lines. */
  count: number
  currency: string
}

/** Joins the cart with current BFF products. All math is integer cents; unknown ids are skipped. */
export function priceCart(cart: Cart, products: readonly Product[]): PricedCart {
  const byId = new Map(products.map((p) => [p.id, p]))
  const lines: PricedLine[] = []
  for (const { productId, quantity } of cart.lines) {
    const product = byId.get(productId)
    if (product) lines.push({ product, quantity, lineTotalCents: product.priceCents * quantity })
  }
  return {
    lines,
    subtotalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
    count: lines.reduce((sum, l) => sum + l.quantity, 0),
    currency: products[0]?.currency ?? 'USD',
  }
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
