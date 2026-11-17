# Submission notes

What we built, the choices behind it, and what we'd change with more time. The architecture itself (diagram, failure tables, file map) is in [`docs/architecture.md`](docs/architecture.md); this file links to it rather than repeating it.

## Run it

```bash
nvm install
npm install
npm run dev
```

| URL | What |
| --- | --- |
| http://localhost:3000 | Storefront (configurator, `/cart`) |
| http://localhost:4000/api/health | BFF health; products at `/api/products` |
| http://localhost:4100 | Mock upstream (unchanged) |

To try outages, restart with one of these set (on the whole `npm run dev`, or on `npm run dev:upstream`):

```bash
UPSTREAM_FAIL_SERVICE=catalog npm run dev   # or content
UPSTREAM_FAILURE_RATE=0.5 npm run dev       # flaky: the BFF's one retry hides most failures
UPSTREAM_LATENCY_MS=5000 npm run dev        # slow: the BFF gives up after 2 s
```

## What we built

| Spec | What the shopper gets | Where |
| --- | --- | --- |
| R1 | Choose between the three mattresses; the choice is in `?product=` so it survives refresh and is shareable | `apps/api/src/products/`, `apps/web/components/ProductConfigurator.tsx` |
| R2 | Configurator laid out like `docs/mock.png`, stacked below 768px | `ProductConfigurator`, `app/globals.css` |
| R3 | Add to cart; the header badge updates at once | `components/CartProvider.tsx`, `HeaderCart.tsx` |
| R4 | `/cart` lists each line with image, name, price | `app/cart/page.tsx`, `components/CartView.tsx` |
| R5 | Quantity stepper (1–10) and Remove | `QuantityStepper.tsx`, `CartView.tsx` |
| R6 | Subtotal from current BFF prices, in integer cents | `lib/cart.ts#priceCart` |
| R7 | Cart survives refresh and syncs across tabs | `localStorage` key `saatva.cart.v1` |

## Key decisions and trade-offs

- **One merged endpoint, `GET /api/products`.** The BFF fetches catalog and content in parallel and joins them on the trimmed, lowercased handle. The web app never sees which upstream a field came from (C2).
- **The catalog decides what's sellable.** Only `active` products with a readable price sell; content-only, discontinued, duplicate and malformed entries are dropped and logged.
- **Prices in integer cents.** `priceCents` is what the shopper pays (a valid sale price, else list); `compareAtPriceCents` is the list price when on sale. The web formats them with `Intl.NumberFormat` and never does float math.
- **Description HTML is sanitized in the BFF** with a small tag allowlist, and rendered by one component (`RichText`), the only `dangerouslySetInnerHTML` in the app.
- **Shared types, not shared code.** `packages/contracts` is a types-only package imported with `import type` by both apps, so the contract can't drift silently.
- **Failure handling.** Upstream calls time out at 2 s and retry once on network errors and 5xx (never on a timeout). Catalog down → `503` and a friendly message; content down → `200` and the page without its marketing copy. The web gives the BFF 5 s, then shows the same message. Malformed upstream data counts as a failure. Details and a scenario table: [`docs/architecture.md#failure-handling`](docs/architecture.md#failure-handling).
- **Accessibility.** Native radio group for the selector, WCAG AA contrast (button, badge and selected segment darkened from the mock), `aria-live` announcements for cart changes, focus kept on a sensible element after Remove or when a stepper button disables, 44 px header cart target, reduced-motion aware skeletons.
- **Server-rendered data, client cart.** Pages load products server-side; the cart is client state over `useSyncExternalStore` with an empty server snapshot, so hydration never mismatches and the badge appears after hydration.

## Cart storage (C3)

We kept the cart in the browser's `localStorage`. With no database allowed and no checkout in scope, it's the simplest store that survives a refresh, and it keeps the BFF stateless.

A line stores only `{ productId, quantity }`. Names, images and prices are always joined from `/api/products`, so a hand-edited value can't change a price and totals use current prices. Corrupt data reads as an empty cart; products that are no longer sold are pruned with a one-time notice.

**Limits.** The cart is per browser and per device; the server can't render the count (the badge appears after hydration); totals are computed on the client, so they are a display, not a charge.

**With a real data store**, the cart moves behind the BFF without changing the components (they only use `useCart()`):

- An opaque cart id in an `HttpOnly`, `SameSite=Lax` cookie, set by the BFF on the first add.
- BFF endpoints: `GET /api/cart`, `POST /api/cart/lines`, `PATCH`/`DELETE /api/cart/lines/:productId`. Each returns the priced cart, so the client never computes money.
- A store keyed by cart id: Redis with a TTL for anonymous carts, Postgres once carts belong to accounts or feed orders.
- The server validates and re-prices on every read and again at checkout (stock, active status, sale windows).
- Merge the anonymous cart into the account cart on login; expire abandoned carts with the TTL.
- The server can render the badge, and the `localStorage` code becomes an optimistic cache or goes away.

## Known limitations

Open review findings we chose not to fix, each small:

- The in-memory fallback, used only when `localStorage` is blocked or full, doesn't sync other tabs.
- The header badge counts products that are no longer sold until `/` or `/cart` prunes the cart.
- There's no overall deadline across the upstream retry; it only matters if `UPSTREAM_TIMEOUT_MS` is raised above ~2.4 s.
- Any upstream 5xx is retried, including non-transient ones (501, 505).
- There's no `global-error.tsx` for errors thrown in the root layout.
- Typing "10" in the quantity box briefly commits 1 before settling on 10.

## With more time

1. **Tests first:** unit tests for the cart functions in `lib/cart.ts`, `product.mapper.ts`, and `UpstreamClient` (retry and timeout).
2. **A BFF-owned cart** as described above.
3. **Structured description content** from the BFF instead of HTML, so the web renders it with components and no HTML trust is needed.
4. **A Content Security Policy** as defense in depth for the description HTML.
5. **Product images cropped** once at the source to the same 1268×698 framing (today we normalized the three we have).
6. Ideas we left out on purpose (the optional phase was skipped):
   - Sizes with per-size pricing.
   - A cart drawer instead of only the page.
   - Short-lived BFF caching of the merged product list.
   - SEO metadata per product.
   - Structured logging with request ids across web, BFF and upstream.

## How we worked

The work followed a spec-driven, phased plan: each phase was planned, implemented, verified in the browser and reviewed before the next. The plan, its decision log and the review notes are in [`docs/plan/README.md`](docs/plan/README.md); the specs are in [`docs/take-home-specs.md`](docs/take-home-specs.md); the frozen starting point is [`docs/base-architecture.md`](docs/base-architecture.md).
