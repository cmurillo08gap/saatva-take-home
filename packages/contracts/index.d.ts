export interface ProductRating {
  average: number // 0–5
  count: number
}

export interface Product {
  id: string // normalized handle, e.g. 'loom-and-leaf'
  name: string
  priceCents: number // what the shopper pays
  compareAtPriceCents: number | null // list price when on sale
  currency: string // ISO 4217, e.g. 'USD'
  imageUrl: string // e.g. '/images/loom-carousel.jpg'
  headline: string | null
  descriptionHtml: string | null // sanitized
  rating: ProductRating | null
  badges: string[]
}

export interface ProductsResponse {
  products: Product[]
}
