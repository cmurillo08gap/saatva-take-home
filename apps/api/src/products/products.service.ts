import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import type { ProductsResponse } from '@saatva/contracts'
import { UpstreamClient } from '../upstream/upstream.client'
import type { CatalogProduct, ContentProduct } from '../upstream/upstream.types'
import { normalizeHandle, resolvePricing, toProduct } from './product.mapper'

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name)

  constructor(private readonly upstream: UpstreamClient) {}

  async getProducts(): Promise<ProductsResponse> {
    const [catalogResult, contentResult] = await Promise.allSettled([
      this.upstream.getCatalogProducts(),
      this.upstream.getContentProducts(),
    ])

    if (catalogResult.status === 'rejected') {
      this.logger.error(`Catalog unavailable: ${String(catalogResult.reason)}`)
      throw new ServiceUnavailableException('Products are temporarily unavailable')
    }

    const contentByHandle = new Map<string, ContentProduct>()
    if (contentResult.status === 'rejected') {
      this.logger.warn(
        `Content unavailable, serving products without copy: ${String(contentResult.reason)}`,
      )
    } else {
      for (const item of contentResult.value) {
        // A malformed entry only loses its own copy; the product still sells from the catalog.
        if (typeof item !== 'object' || item === null) continue
        contentByHandle.set(normalizeHandle(item.handle), item)
      }
    }

    const { meta } = catalogResult.value
    // Entries that aren't objects can't be priced or identified; skip them like an unreadable price.
    const data = catalogResult.value.data.filter(
      (p): p is CatalogProduct => typeof p === 'object' && p !== null,
    )
    const catalogHandles = new Set(data.map((p) => normalizeHandle(p.productHandle)))
    const contentOnly = [...contentByHandle.keys()].filter((h) => !catalogHandles.has(h))
    if (contentOnly.length > 0) {
      this.logger.warn(`Dropping content-only products: ${contentOnly.join(', ')}`)
    }

    const products: ProductsResponse['products'] = []
    const seen = new Set<string>()
    for (const item of data) {
      const handle = normalizeHandle(item.productHandle)
      // Allowlist: only an explicit "active" sells; "discontinued" and unknown statuses don't.
      const status = typeof item.status === 'string' ? item.status.trim().toLowerCase() : ''
      if (status !== 'active') {
        if (status !== 'discontinued') {
          const shown = JSON.stringify(item.status)
          this.logger.warn(`Dropping product with unknown status ${shown}: ${handle}`)
        }
        continue
      }
      if (handle === '') {
        this.logger.warn('Dropping catalog product without a handle')
        continue
      }
      if (seen.has(handle)) {
        this.logger.warn(`Dropping duplicate catalog product: ${handle}`)
        continue
      }
      const pricing = resolvePricing(item)
      if (!pricing) {
        this.logger.warn(`Dropping product with unreadable price: ${handle}`)
        continue
      }
      if (pricing.saleIgnored) this.logger.warn(`Ignoring invalid sale price: ${handle}`)
      const product = toProduct(item, pricing, contentByHandle.get(handle), meta.currency)
      if (!product) {
        this.logger.warn(`Dropping product with unusable name or image key: ${handle}`)
        continue
      }
      seen.add(handle)
      products.push(product)
    }

    return { products }
  }
}
