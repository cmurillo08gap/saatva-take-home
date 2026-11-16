# Phase 1: Products BFF

**Status:** Accepted · **Specs:** R1 · C1 C2 C4 · **Depends on:** —

## Goal

`GET /api/products` returns one merged, typed product list with everything the configurator needs (name, price, image, rating, description) and nothing that reveals which upstream a field came from. The response type lives in a shared contracts package both apps import.

## Scope

- Merge catalog and content data in `apps/api/src/products/products.service.ts`, using the existing `UpstreamClient` (`getCatalogProducts()`, `getContentProducts()` in `apps/api/src/upstream/upstream.client.ts`).
- Normalize the upstream data quirks (listed under Tasks).
- A typed response contract in a shared, types-only workspace package (`packages/contracts`).
- A defined behavior when one upstream fails, and a timeout so a hung upstream can't hang the route.

### Out of scope

- Any UI (Phase 2). Web importing the contract type starts in Phase 2.
- Cart endpoints and cart types (Phase 3); they'll go into the same contracts package.
- Caching, retries, unit tests (Phase 5).
- Changes to `services/upstream` (C4: never).

## Observed upstream data

What the planning session found in `services/upstream/data/`:

- Zenhaven's content `handle` is `"Zenhaven"`; the catalog's `productHandle` is `zenhaven`.
- Loom & Leaf's `reviews.average` / `count` are strings (`"4.0"`, `"1876"`), although `upstream.types.ts` declares numbers. Provider types can't be trusted, so values are checked at runtime.
- `saatva-youth` exists only in content (no price, no image).
- No product is currently `discontinued`, but the field exists.
- Loom & Leaf has an active sale (`119900` vs `129900`). The mock shows `$1,299`; Phase 2 decides how sale prices are displayed.

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Join key | Exact `productHandle` = `handle` / case-insensitive, trimmed | **Trimmed and lowercased on both sides.** Fixes `Zenhaven` vs `zenhaven` and similar cases. The normalized handle becomes the product `id`. |
| Products present in only one source | Drop / include with gaps | **The catalog decides what's sellable.** Content-only products (`saatva-youth`) are dropped and logged: no price, nothing to sell. Catalog products without content are included, with `null` content fields. |
| Discontinued products | Filter out / return with a flag | **Filtered out in the BFF.** They can't be bought; Phase 3's cart validation reuses the same filter. |
| Price shape | Cents integers / formatted strings / both | **Integer cents: `priceCents` is what the shopper pays (the sale price when valid), `compareAtPriceCents` is the list price when on sale, else `null`; plus `currency` from catalog meta.** The BFF owns the pricing rule, so the cart total (R6) can't disagree with the configurator. Web formats with `Intl.NumberFormat`. A sale price is valid only if it's an integer with `0 < sale < list`; otherwise it's ignored and logged. |
| Description HTML | Pass through / sanitize in the BFF / send plain text | **Sanitized in the BFF** with an allowlist (`p`, `strong`, `em`, `ul`, `ol`, `li`, `br`, no attributes) using `sanitize-html` (exact pin). Defense in depth: a third party saying its HTML is trusted isn't a guarantee we can rely on. Web renders the result as-is. |
| One upstream down | Fail the whole request / degrade (e.g. products without copy) | **Catalog down: `503`** with a generic body (no prices means nothing sellable). **Content down: `200`** with products whose `headline`, `descriptionHtml` and `rating` are `null`, and `badges` is `[]`; logged as a warning. Neither body names an upstream. |
| Where the contract type lives | BFF only, mirrored in web / shared package | **Shared types-only package `@saatva/contracts` in `packages/contracts`, as an `index.d.ts`.** One source of truth for the BFF and web contract. A `.d.ts` avoids the API's `rootDir: ./src` limit (TS6059), and `import type` compiles away, so there's no build step. Upstream changes stay in `upstream.types.ts` and the BFF mapper. |
| Bad upstream values | Throw / drop / null | **Checked by hand, no schema library.** A product whose price can't be read is dropped and logged. A rating that can't be read becomes `null`. Bad `badges` become `[]`. |
| Image URL | BFF builds the path / web maps `imageKey` | **The BFF returns `imageUrl: /images/<imageKey>.jpg`.** Web doesn't see provider keys. Trade-off noted for Phase 6: the BFF knows web's static path. |
| Upstream timeout | None / per-request timeout | **`AbortSignal.timeout` in `UpstreamClient`, configurable via `UPSTREAM_TIMEOUT_MS` (default 3000).** A timeout counts as a failure of that upstream. |

## Contract

```ts
// packages/contracts/index.d.ts
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
```

Error (catalog down or timed out): `503` with Nest's standard body, message `Products are temporarily unavailable`.

## Tasks

- [x] Create `packages/contracts` (`package.json` named `@saatva/contracts`, `private`, `types: index.d.ts`, no dependencies) with the contract above; add `packages/*` to root `workspaces`; add `"@saatva/contracts": "*"` to `apps/api` dependencies; run `npm install` so the lockfile and link update.
- [x] Add a timeout to `UpstreamClient.get` (`AbortSignal.timeout`, `UPSTREAM_TIMEOUT_MS`, default 3000); log and rethrow on timeout like other failures. Document the variable in `docs/architecture.md`'s configuration table (not the frozen `base-architecture.md`).
- [x] Add `sanitize-html` and `@types/sanitize-html` to `apps/api`, pinned exactly.
- [x] Write the mapping as pure functions in `apps/api/src/products/product.mapper.ts`: `normalizeHandle`, `parseCents`, `parseRating`, `sanitizeDescription`, `toProduct(catalog, content | undefined, currency)`.
- [x] In `ProductsService.getProducts()`: fetch both upstreams in parallel with `Promise.allSettled`; catalog rejected → `ServiceUnavailableException`; content rejected → warn and continue with no content.
- [x] Index content by normalized handle; map catalog products in catalog order; drop discontinued products and products with an unreadable price; log content-only handles that were dropped (warn, once per request).
- [x] Return `ProductsResponse` from the controller, typed with `import type` from `@saatva/contracts`.
- [x] Create `docs/architecture.md` (living doc extending `base-architecture.md`) with the products endpoint and configuration.
- [x] Verify (see Acceptance criteria) and fill in the Verification log.

## Acceptance criteria

- [ ] `GET http://localhost:4000/api/products` returns `{ products: [...] }` with Saatva Classic, Loom & Leaf and Zenhaven, in catalog order, each with `name`, `priceCents`, `imageUrl`, `rating` and `descriptionHtml`.
- [ ] Loom & Leaf has `priceCents: 119900` and `compareAtPriceCents: 129900`; the other two have `compareAtPriceCents: null`.
- [ ] Zenhaven has its headline, description and rating, despite the handle case mismatch.
- [ ] Loom & Leaf's rating is `{ average: 4, count: 1876 }`: all numbers in the response are numbers, not strings.
- [ ] `saatva-youth` is not in the response.
- [ ] The response contains no upstream names or provider field names (`sku`, `productHandle`, `displayName`, `imageKey`, `salePriceCents`, `reviews`, `status`, `meta`, `source`, `catalog`, `content`).
- [ ] `descriptionHtml` keeps the allowlisted tags (Classic's `<ul>` list) and drops anything else.
- [ ] With `UPSTREAM_FAIL_SERVICE=catalog`: `503` with a body that doesn't name an upstream; the API process keeps running.
- [ ] With `UPSTREAM_FAIL_SERVICE=content`: `200`, three products with prices and images, content fields `null` / `[]`.
- [ ] With `UPSTREAM_LATENCY_MS` above the timeout: the route answers within about the timeout (`503`), and doesn't hang.
- [ ] `services/upstream` is unchanged (`git diff services/` is empty).
- [ ] `npm run build -w apps/api` and `npm run build -w apps/web` pass; `npm install && npm run dev` works from a clean checkout.

## Verification log

Verified 2026-11-16 against `npm run dev:upstream` + `npm run dev:api`, using `curl`.

- [x] `GET /api/products` returns Saatva Classic, Loom & Leaf, Zenhaven in catalog order with name, priceCents, imageUrl, rating, descriptionHtml.
- [x] Loom & Leaf: `priceCents` 119900, `compareAtPriceCents` 129900; others `null`.
- [x] Zenhaven has headline, description and rating despite the handle case mismatch.
- [x] Loom & Leaf rating is `{ average: 4, count: 1876 }` (numbers).
- [x] `saatva-youth` absent; logged once per request as a content-only drop.
- [x] Grep of the response for `sku`, `productHandle`, `displayName`, `imageKey`, `salePriceCents`, `reviews`, `status`, `meta`, `source`, `catalog`, `content` found no matches.
- [x] Sanitizer keeps `p`/`strong`/`ul`/`li` (Classic's list intact); `<script>`, `<a>` and attributes are stripped (checked directly with the same options).
- [x] `UPSTREAM_FAIL_SERVICE=catalog`: `503`, body `Products are temporarily unavailable`; `/api/health` still `200`.
- [x] `UPSTREAM_FAIL_SERVICE=content`: `200`, three products with prices and images, `headline`/`descriptionHtml`/`rating` `null`, `badges` `[]`.
- [x] `UPSTREAM_LATENCY_MS=5000`: `503` after 3.01s. With upstream stopped: `503`. Recovers to `200` once upstream is back.
- [x] `git status services/` is empty.
- [x] `npm run build -w apps/api` passes.
- [~] `npm run build -w apps/web` passes on most runs but fails intermittently (about 1 in 3) with `SecurityFatalError: Your version of Next.js is affected by a known security vulnerability` from Next 16.4.3's advisory check. Unrelated to this phase's changes; upgrading Next is outside Phase 1's scope.
- [ ] `npm install && npm run dev` from a clean checkout was not re-run from scratch; `npm install` was run after the workspace change and `dev:upstream` / `dev:api` start fine.

### Scope notes

- `resolvePricing` is exported from `product.mapper.ts` (beyond the planned function list) so the service can log ignored sale prices.
- Upstream types declare `priceCents` as `string`, which matches the data; `parseCents` accepts numbers or numeric strings.
- Added `docs/architecture.html`, an interactive version of the living architecture doc with simulated upstream latency, timeout and failure controls (not in the original task list).
- `UPSTREAM_TIMEOUT_MS` falls back to 3000 if unset or invalid.

## Review

_Empty._
