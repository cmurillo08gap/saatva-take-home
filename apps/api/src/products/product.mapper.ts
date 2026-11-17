import sanitizeHtml from 'sanitize-html'
import type { Product, ProductRating } from '@saatva/contracts'
import type { CatalogProduct, ContentProduct } from '../upstream/upstream.types'

export function normalizeHandle(handle: unknown): string {
  return typeof handle === 'string' ? handle.trim().toLowerCase() : ''
}

/** Reads a cents value that may arrive as a number or numeric string. Returns null unless it is a non-negative integer. */
export function parseCents(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : null
}

function parseNumber(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

export function parseRating(reviews: unknown): ProductRating | null {
  if (typeof reviews !== 'object' || reviews === null) return null
  const average = parseNumber((reviews as Record<string, unknown>).average)
  const count = parseNumber((reviews as Record<string, unknown>).count)
  if (average === null || count === null) return null
  if (average < 0 || average > 5 || !Number.isInteger(count) || count < 0) return null
  return { average, count }
}

export function sanitizeDescription(html: unknown): string | null {
  if (typeof html !== 'string') return null
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
    allowedAttributes: {},
  })
}

function parseBadges(badges: unknown): string[] {
  return Array.isArray(badges) && badges.every((b) => typeof b === 'string')
    ? (badges as string[])
    : []
}

/** Returns the shopper price and, when a valid sale applies, the list price. Null if the list price is unreadable. */
export function resolvePricing(
  catalog: CatalogProduct,
): { priceCents: number; compareAtPriceCents: number | null; saleIgnored: boolean } | null {
  const list = parseCents(catalog.priceCents)
  if (list === null) return null
  if (catalog.salePriceCents === null || catalog.salePriceCents === undefined) {
    return { priceCents: list, compareAtPriceCents: null, saleIgnored: false }
  }
  const sale = parseCents(catalog.salePriceCents)
  if (sale !== null && sale > 0 && sale < list) {
    return { priceCents: sale, compareAtPriceCents: list, saleIgnored: false }
  }
  return { priceCents: list, compareAtPriceCents: null, saleIgnored: true }
}

export type Pricing = NonNullable<ReturnType<typeof resolvePricing>>

/** Image keys become a path segment, so only plain slugs are accepted. */
const IMAGE_KEY = /^[A-Za-z0-9_-]+$/

/** Maps a catalog product (plus optional content) to the public contract. Null if the name or image key is unusable. */
export function toProduct(
  catalog: CatalogProduct,
  pricing: Pricing,
  content: ContentProduct | undefined,
  currency: string,
): Product | null {
  const name = typeof catalog.displayName === 'string' ? catalog.displayName.trim() : ''
  const imageKey = typeof catalog.imageKey === 'string' ? catalog.imageKey.trim() : ''
  if (name === '' || !IMAGE_KEY.test(imageKey)) return null
  return {
    id: normalizeHandle(catalog.productHandle),
    name,
    priceCents: pricing.priceCents,
    compareAtPriceCents: pricing.compareAtPriceCents,
    currency,
    imageUrl: `/images/${imageKey}.jpg`,
    headline: typeof content?.headline === 'string' ? content.headline : null,
    descriptionHtml: sanitizeDescription(content?.descriptionHtml),
    rating: parseRating(content?.reviews),
    badges: parseBadges(content?.badges),
  }
}
