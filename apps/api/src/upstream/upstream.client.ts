import { Injectable, Logger } from '@nestjs/common'
import type { CatalogResponse, ContentResponse } from './upstream.types'

const UPSTREAM_URL = process.env.UPSTREAM_URL ?? 'http://localhost:4100'
const parsedTimeout = Number(process.env.UPSTREAM_TIMEOUT_MS)
// Per attempt. Worst case (slow 5xx, then a retry that times out) stays under the web's 5 s timeout.
const UPSTREAM_TIMEOUT_MS =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 2000
const RETRY_DELAY_MS = 150

/**
 * Thin client for the upstream catalog and content services.
 * Each request has a timeout and one retry on network errors and 5xx (never on a timeout, which
 * would double the wait). A body that isn't the documented shape counts as a failure.
 */
@Injectable()
export class UpstreamClient {
  private readonly logger = new Logger(UpstreamClient.name)

  async getCatalogProducts(): Promise<CatalogResponse> {
    const body = await this.get<CatalogResponse>('/catalog/v1/products')
    // The web formats prices with Intl.NumberFormat, which needs a real currency code.
    if (!Array.isArray(body?.data) || !/^[A-Z]{3}$/.test(String(body?.meta?.currency))) {
      throw new Error('Upstream catalog returned an unexpected shape')
    }
    return body
  }

  async getContentProducts(): Promise<ContentResponse> {
    const body = await this.get<ContentResponse>('/content/v1/products')
    if (!Array.isArray(body)) throw new Error('Upstream content returned an unexpected shape')
    return body
  }

  private async get<T>(path: string, attempt = 1): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${UPSTREAM_URL}${path}`, {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      })
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'TimeoutError'
      this.logger.warn(`GET ${path} ${timedOut ? 'timed out' : 'failed'} (attempt ${attempt})`)
      if (!timedOut && attempt === 1) return this.retry<T>(path)
      throw new Error(`Upstream request ${timedOut ? 'timed out' : 'failed'}: ${path}`)
    }

    if (!res.ok) {
      this.logger.warn(`GET ${path} -> ${res.status} (attempt ${attempt})`)
      if (res.status >= 500 && attempt === 1) return this.retry<T>(path)
      throw new Error(`Upstream request failed: ${path} (${res.status})`)
    }

    // A body that isn't JSON throws here and is treated like any other upstream failure.
    return (await res.json()) as T
  }

  private async retry<T>(path: string): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return this.get<T>(path, 2)
  }
}
