# Phase 1: Products BFF

**Status:** Not started · **Specs:** R1 · C1 C2 C4 · **Depends on:** —

## Goal

`GET /api/products` returns one merged, typed product list with everything the configurator needs (name, price, image, rating, description) and nothing that reveals which upstream a field came from.

## Scope

- Merge catalog and content data in `apps/api/src/products/products.service.ts`, using the existing `UpstreamClient` (`getCatalogProducts()`, `getContentProducts()` in `apps/api/src/upstream/upstream.client.ts`).
- Normalize the upstream data quirks (listed under Tasks).
- A typed response contract the web app can rely on.
- A defined behavior when one upstream fails.

### Out of scope

- Any UI (Phase 2).
- Cart endpoints (Phase 3).
- Changes to `services/upstream` (C4: never).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Join key | Exact `productHandle` = `handle` / case-insensitive, trimmed | _Open_. Content has `"Zenhaven"` vs catalog `zenhaven` |
| Products present in only one source | Drop / include with gaps | _Open_. `saatva-youth` has content but no catalog entry, so no price |
| Discontinued products | Filter out / return with a flag | _Open_ |
| Price shape | Cents integers / formatted strings / both | _Open_. Upstream sends cents as strings; sale price can be null |
| Description HTML | Pass through / sanitize in the BFF / send plain text | _Open_. Provider calls it trusted CMS HTML |
| One upstream down | Fail the whole request / degrade (e.g. products without copy) | _Open_ |
| Where the contract type lives | BFF only, mirrored in web / shared package | _Open_ |

## Tasks

Draft; finalized in the planning session.

- [ ] Define the response type (e.g. `id`, `name`, `priceCents`, `salePriceCents`, `imageUrl`, `rating { average, count }`, `headline`, `descriptionHtml`, `badges`). No `source`, `sku`-vs-`handle` leakage, or provider field names.
- [ ] Fetch both upstreams in parallel.
- [ ] Normalize the join key and merge.
- [ ] Coerce numeric strings to numbers (`priceCents`, `salePriceCents`, Loom & Leaf's `reviews.average` / `count`), with validation for unparseable values.
- [ ] Apply the decisions on single-source and discontinued products.
- [ ] Map `imageKey` to an image path served by web (`/images/<key>.jpg`).
- [ ] Apply the description HTML decision.
- [ ] Implement the upstream-failure behavior with a clear HTTP status and error body.
- [ ] Wire the route in `products.controller.ts`.

## Acceptance criteria

- [ ] `GET http://localhost:4000/api/products` returns Saatva Classic, Loom & Leaf and Zenhaven, each with name, price (sale price where active), image URL, rating and description.
- [ ] Zenhaven has its content (headline, rating), despite the handle case mismatch.
- [ ] All numbers in the response are numbers, not strings.
- [ ] The response contains no upstream names, provider field names or source metadata.
- [ ] `services/upstream` is unchanged (`git diff services/` is empty).
- [ ] With `UPSTREAM_FAIL_SERVICE=catalog` and `=content`, the route behaves as decided, and the API process doesn't crash.
- [ ] `npm run build -w apps/api` passes.

## Verification log

_Empty._

## Review

_Empty._
