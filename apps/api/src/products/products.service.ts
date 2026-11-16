import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import type { ProductsResponse } from '@saatva/contracts'
import { UpstreamClient } from '../upstream/upstream.client'
import type { ContentProduct } from '../upstream/upstream.types'
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
      for (const item of contentResult.value)
        contentByHandle.set(normalizeHandle(item.handle), item)
    }

    const { meta, data } = catalogResult.value
    const catalogHandles = new Set(data.map((p) => normalizeHandle(p.productHandle)))
    const contentOnly = [...contentByHandle.keys()].filter((h) => !catalogHandles.has(h))
    if (contentOnly.length > 0) {
      this.logger.warn(`Dropping content-only products: ${contentOnly.join(', ')}`)
    }

    const products: ProductsResponse['products'] = []
    for (const item of data) {
      const handle = normalizeHandle(item.productHandle)
      if (item.status === 'discontinued') continue
      const pricing = resolvePricing(item)
      if (!pricing) {
        this.logger.warn(`Dropping product with unreadable price: ${handle}`)
        continue
      }
      if (pricing.saleIgnored) this.logger.warn(`Ignoring invalid sale price: ${handle}`)
      const product = toProduct(item, contentByHandle.get(handle), meta.currency)
      if (product) products.push(product)
    }

    return { products }
  }
}
