import type { Product, ProductsResponse } from '@saatva/contracts'

// Server-side code can't use the /api rewrite (that only applies to browser
// requests), so it talks to the BFF directly.
const API_URL = process.env.API_URL ?? 'http://localhost:4000'

/** Longer than the BFF's worst case (2 s upstream timeout + one retry), so the BFF answers first. */
const API_TIMEOUT_MS = 5000

/** Thrown messages are for logs only; pages show their own friendly copy. */
export async function apiGet<T>(path: string): Promise<T> {
  const isServer = typeof window === 'undefined'
  const url = isServer ? `${API_URL}${path}` : path

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(API_TIMEOUT_MS) })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`GET ${path} timed out after ${API_TIMEOUT_MS} ms`)
    }
    throw new Error(`GET ${path} failed: BFF unreachable`, { cause: error })
  }
  if (!res.ok) {
    throw new Error(`GET ${path} failed (HTTP ${res.status})`)
  }
  return (await res.json()) as T
}

/** Loads the product list; throws (for the page to catch) unless the body has a products array. */
export async function getProducts(): Promise<Product[]> {
  const body = await apiGet<Partial<ProductsResponse> | null>('/api/products')
  if (!Array.isArray(body?.products)) {
    throw new Error('GET /api/products returned an unexpected body')
  }
  return body.products
}
