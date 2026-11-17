# Phase 5: Hardening

**Status:** Accepted · **Specs:** quality pass over R1–R7 · **Depends on:** Phase 4

## Goal

The app behaves well when things go wrong and holds up on accessibility and responsive checks.

## Scope

- Upstream failures, checked with `UPSTREAM_FAIL_SERVICE=catalog|content` and `UPSTREAM_FAILURE_RATE` (and slow responses via `UPSTREAM_LATENCY_MS`).
- BFF down while the web app is up.
- Edge cases: quantity bounds, corrupt or stale cart data in localStorage, a product that becomes unavailable while in the cart.
- Accessibility pass: keyboard navigation, focus states, labels, live regions, contrast.
- Responsive pass: mobile, tablet, desktop.
- BFF error responses: one consistent JSON shape; malformed upstream data treated as a failure.
- Navigation loading feel (from Phase 4 review): the skeleton flashes when moving between `/` and `/cart`.
- Image consistency (from Phase 4 review): normalize the three product images to one size and framing.
- Phase 4 post-acceptance review backlog (larger items plus cheap minors), listed in Tasks.
- Confirm the console is clean in a profile without extensions.

**Scope change (planning session, 2026-11-16):** the draft scope listed "invalid input to cart routes", "an expired or unknown cart id" and "invalid cart requests get 4xx". Phase 3 chose localStorage, so the BFF has no cart routes and there is no cart id. These became BFF error-shape hardening (all routes) and client-side cart robustness (corrupt storage, unknown ids). The Phase 2 candidate "defense in depth for the description HTML" is deferred to Phase 6 notes (see Decisions).

### Out of scope

- New features (Phase 7).
- BFF caching of product data (Phase 7 candidate, see Decisions).
- `memoryRaw` fallback not syncing across tabs (Phase 4 review minor; storage-unavailable edge case only).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Timeouts and retries toward upstream | None / timeout only / timeout + retry | **Timeout + one retry.** Per-attempt timeout `UPSTREAM_TIMEOUT_MS` (default lowered 3000 → 2000). Retry once after ~150 ms on connection errors and 5xx only; never retry a timeout (it would double the wait). Worst case ~4.15 s (slow 5xx, then a timed-out retry; corrected during implementation), under the web's 5 s fetch timeout. With `UPSTREAM_FAILURE_RATE=0.3`, catalog failure drops from 30% to ~9% |
| Caching of product data in the BFF | None / short in-memory TTL | **None** (developer's call). Stays a Phase 7 candidate. The skeleton flash is fixed on the web side instead |
| Navigation loading feel | Progress bar / keep previous page / caching / delayed skeleton | **Delayed skeleton.** Skeletons fade in after ~300 ms (CSS `animation-delay`, `opacity: 0` until then), so fast navigations show nothing and slow ones still get feedback. Respects `prefers-reduced-motion`. Checked in a production build too, since dev mode exaggerates the delay |
| Unavailable product in cart | Remove silently / keep and flag / block checkout / remove and notify | **Remove and notify.** `prune` returns the number of lines removed; when > 0, a one-time notice "1 item is no longer available and was removed from your cart" (plural aware). Lines store only id + quantity (Phase 3), so the product can't be named. Shown only in the tab that pruned. Keep-and-flag would need a name snapshot in storage, reversing Phase 3 |
| Contrast | Darken fills / dark text on accent / keep mock and document | **Darken fills, keep white text.** The mock's button (white on `#d4aa79`, ~2.1:1) and badge (white on `#c39a85`, ~2.6:1) fail AA. Fills move to tans reaching ≥ 4.5:1 (targets ≈ `#8f6a3f` button with a darker hover, ≈ `#8e6553` badge; confirm with a checker). New tokens in `globals.css`; logo colour unchanged (logos are exempt) |
| BFF error responses | Nest default / custom envelope | **Nest's default shape everywhere** `{ statusCode, message, error }`, from Nest's built-in exception handling: unknown routes → 404 JSON, unexpected errors → 500 without stack traces. No custom filter needed |
| Malformed upstream data | Trust the documented shape / validate | **Validate the minimal shape** in `UpstreamClient` (catalog `data` is an array and `meta.currency` a string; content is an array; body is JSON). Malformed = upstream failure, handled like a 503 (catalog → BFF 503, content → null copy). Today a bad shape throws a TypeError → 500 |
| Image consistency | Accept and document / shared CSS framing / normalize the files | **Normalize the files** (developer's call; processed once, the files are committed). The frame is 634/349 and `object-fit: cover` crops the wide Loom/Zen scenes (1680×640) to their centre, cutting off the left of the mattress, while Classic (634×349) is a tight mattress shot. Re-crop Loom (mattress ≈ x 65–840, y 130–555) and Zen (≈ x 25–835, y 140–540) tightly around the bed at 634:349, then export all three at **1268×698** (2× the desktop frame), Lanczos resize, light sharpen on Classic (upscaled 2×). Overwritten in place so the BFF's `imageUrl`s don't change; originals stay in git history. The frame then matches every file, so CSS no longer crops |
| Description defense in depth | Second sanitizer in web / CSP + Trusted Types / defer | **Defer to Phase 6 notes.** A CSP strong enough to matter needs nonces (forces dynamic rendering and middleware); a second sanitizer adds a dependency on top of a BFF allowlist that permits no attributes. `RichText` stays the single sink |

## Tasks

**BFF (`apps/api`)**

- [x] `src/upstream/upstream.client.ts`: retry-once policy and lowered default timeout as decided; minimal shape validation; log the attempt number. Keep `AbortSignal.timeout`.
- [x] Error responses use Nest's built-in shape (no custom filter needed).
- [x] `products.service.ts`: confirm malformed content takes the degrade path and malformed catalog the 503 path.

**Web failures (`apps/web`)**

- [x] `lib/api.ts#apiGet`: `AbortSignal.timeout(5000)`; distinguish timeout, network and HTTP errors in the thrown message (logs only).
- [x] `app/error.tsx` (client error boundary, "Try again" calls `reset()`) and `app/not-found.tsx` (friendly 404 with a link home).
- [x] `CartUnavailable` / `ProductsUnavailable`: `role="alert"` moves from the whole section to the message text.

**Cart robustness and the unavailable-product notice**

- [x] `components/CartProvider.tsx`: `prune` returns the removed count; add `notice` state and `dismissNotice`.
- [x] New `components/CartNotice.tsx`, rendered under the header in `layout.tsx` (status region, dismiss button).
- [x] `lib/cart.ts`: `setLineQuantity` ignores NaN (returns the same cart); `parseCart` drops lines with quantity ≤ 0 instead of turning them into 1.

**Accessibility (Phase 4 review + pass)**

- [x] One persistent live region per view: `CartView` renders its status once, outside the empty/populated branches, so announcements made while the view switches are not lost. Same single region for the configurator's "Added …" status.
- [x] Skeletons (`app/loading.tsx`, `CartSkeleton`): `role="status"` with visually hidden "Loading…" text instead of `aria-label` on a div.
- [x] `QuantityStepper`: when + or − becomes disabled while focused, move focus to the input; drop a stale typed draft when `quantity` changes from outside.
- [x] `CartView`: clear `pendingFocus` when `removeItem` was a no-op; `encodeURIComponent(product.id)` in the product link; `<aside>` → `<section aria-label="Order summary">`.
- [x] `HeaderCart`: 44×44 px hit area.
- [x] Contrast tokens as decided; audit the remaining text/fill pairs (segmented selected label, muted text; disabled controls are exempt).
- [x] Keyboard pass across `/`, `/cart`, the error and 404 pages: tab order, visible focus, Enter/Space on every control.

**Loading feel and images**

- [x] `globals.css`: delayed skeleton fade-in with a reduced-motion fallback.
- [x] Normalize the three product images: crop boxes per file as decided, resize to 1268×698, write back to `apps/web/public/images/`. Tune the crop boxes by eye: switch between the three mattresses in the browser and compare screenshots at desktop and mobile until the bed sits at the same size and position in each.

**Responsive**

- [x] Check 375 / 768 / 1280 on `/`, `/cart` (empty and full), the unavailable pages and the 404; fix any horizontal scroll.

**Docs**

- [x] `docs/architecture.md` (+ `docs/architecture.html`): failure handling section (timeouts, retry, error shape, degraded modes table) and the cart notice.
- [x] `docs/plan/README.md` decision log rows; add the CSP/sanitizer reasoning and the image normalization to the Phase 6 notes.

**Code review (last step, after verification passes and before `Ready for review`)**

- [x] Run `/code-review medium` over the **whole application as it stands after Phase 5** (everything built in Phases 1–5, not just this phase's diff), using path targets, as two separate reviews, one per subject, so each gets a focused read. `services/upstream/` is excluded (simulated third party, not editable); `packages/contracts/` is read as context for both.
  1. **BFF and resilience:** `apps/api/` plus `apps/web/lib/api.ts`, `apps/web/next.config.mjs`, `app/error.tsx`, `app/not-found.tsx`, the unavailable components. Upstream mapping and normalization, pricing in cents, sanitization, retry and timeout logic, error shape, shape validation, nothing crashes or leaks.
  2. **Web UI and accessibility:** the rest of `apps/web/` (pages, components, `lib/cart.ts`, `lib/format.ts`, `globals.css`). Cart state and persistence, totals, hydration, focus management, live regions, contrast, responsive CSS.
- [x] Give both reviews the Phase 4 review list (in `phase-4-cart-view.md`) and this phase's tasks, so already-fixed or already-decided items aren't re-reported as new.
- [x] Collect the findings into a **Code review** subsection of this file's Review section, grouped by subject, each with severity, file:line and a one-line failure scenario. Keep only **critical** and **medium** findings; drop low-value ones (style, nits) and say how many were dropped.
- [x] **Critical** findings (wrong totals, crashes, lost cart data, keyboard traps, broken failure handling) are fixed in this phase and re-verified; note each fix in the Verification log. **Medium** findings are listed with a recommendation (fix now / Phase 6 / Phase 7) for the developer to decide; nothing medium is fixed without that decision.

## Acceptance criteria

- [x] Each failure mode shows a clear message and no process crashes: catalog down, content down, `UPSTREAM_FAILURE_RATE=0.5`, `UPSTREAM_LATENCY_MS=5000`, BFF stopped while web runs, unknown URL.
- [x] BFF errors (unknown route, catalog 503, malformed upstream) return the consistent JSON body, with no stack traces.
- [x] A cart holding a retired or unknown id is pruned and the shopper sees the notice once; corrupt JSON or bad quantities in storage never crash the page.
- [x] All interactive elements are reachable and usable by keyboard; focus never falls to `<body>` at stepper limits or after Remove.
- [x] Add, quantity and remove announcements fire from one persistent live region per view.
- [x] Button and badge text reach ≥ 4.5:1.
- [x] No horizontal scroll at 375px; layouts hold at tablet and desktop.
- [x] Fast navigations between `/` and `/cart` show no skeleton flash in a production build.
- [x] All three product images are 1268×698, and switching mattresses shows the bed at the same size and position with nothing cut off.
- [x] Both builds pass; the console is clean in a profile without extensions (or extension-origin messages are identified).
- [x] Upstream env vars are restored to defaults after testing.
- [x] Two medium code reviews (BFF/resilience and web UI/accessibility) ran over the whole application after Phase 5; no critical finding is left open, and medium findings are listed in Review with a recommendation.

## Verification plan

- `npm run build -w apps/api` and `npm run build -w apps/web`.
- `npm run dev` in the background; full shopper flow in the built-in browser.
- `curl` the BFF: `/api/products`, `/api/nope`, and each upstream failure mode, checking status and body.
- Restart upstream with each of `UPSTREAM_FAIL_SERVICE=catalog`, `UPSTREAM_FAIL_SERVICE=content`, `UPSTREAM_FAILURE_RATE=0.5`, `UPSTREAM_LATENCY_MS=5000`; check `/` and `/cart`. Stop the api and reload both pages. Restore defaults.
- Seed localStorage with `{"lines":[{"productId":"gone","quantity":2},{"productId":"saatva-classic","quantity":0}]}` and with invalid JSON; reload.
- Keyboard-only pass; `resize_window` mobile / tablet / desktop, then reset; `read_console_messages` and `read_network_requests`.
- Production build (`next build && next start`) to check the skeleton flash.
- Last: the two code reviews (see Tasks). After fixing critical findings, re-run the builds and the browser checks those fixes touch.

## Verification log

2026-11-16, implementation session.

**Builds.** `npm run build -w apps/api` and `npm run build -w apps/web` pass (re-run after the code review fixes).

**BFF (`curl`).**

- `/api/products` 200 with three products; `/api/nope` → `404 {"statusCode":404,"message":"Cannot GET /api/nope","error":"Not Found"}`.
- `UPSTREAM_FAIL_SERVICE=catalog` → `503 {"statusCode":503,"message":"Products are temporarily unavailable","error":"Service Unavailable"}` in ~0.6 s; log shows `attempt 1/2` and `attempt 2/2`.
- `UPSTREAM_FAIL_SERVICE=content` → 200, copy fields `null` / `[]`.
- `UPSTREAM_FAILURE_RATE=0.5` → 16/20 requests 200 (retry working; ~25% expected failures), `/` served 200 every time.
- `UPSTREAM_LATENCY_MS=5000` → 503 at 2.03 s (timeout, no retry); `/` shows "Our mattresses are taking a nap" at 2.1 s.
- Malformed upstream via a throwaway stub on :4101 (BFF from `dist` on :4002, `services/upstream` untouched): `data` not an array → 503; body not JSON → 503; content not an array → 200 without copy; `null` / number entries in both lists skipped; `meta.currency: ""` → 503 (after the review fix).
- No stack traces in any response body.

**Web failure modes (browser pane + `curl`).**

- Catalog down: `/` shows "Our mattresses are taking a nap", `/cart` shows "We can't show your cart right now"; the stored cart is untouched.
- Content down: configurator renders without headline, rating, description and badges.
- BFF stopped: both pages show the unavailable message immediately; web log `GET /api/products failed: BFF unreachable`.
- BFF hung (socket that never answers on :4000): `/` answers at 5.07 s with the unavailable message; log `timed out after 5000 ms`.
- BFF returning 200 `{}`: both pages show the unavailable message (after the review fix; before it this would have thrown past the page's try).
- Unknown URL `/does-not-exist`: HTTP 404, "We couldn't find that page" with a link home.
- No process crashed in any scenario. The api was killed once by my own `lsof tcp:4100 | xargs kill` (it matched the api's sockets to upstream), not by a failure; later restarts used `-sTCP:LISTEN`.
- Upstream restored to defaults (`latency=150ms failureRate=0 failService=none`) before the remaining checks.

**Cart robustness.**

- Seeded `{"lines":[{"productId":"gone","quantity":2},{"productId":"saatva-classic","quantity":0},…]}`: quantity-0 line dropped by `parseCart`, unknown ids pruned, notice "2 items are no longer available and were removed from your cart." shown once; storage rewritten.
- Seeded `{not json`: page loads, empty cart, no notice, no error.
- Notice dismissed by keyboard: focus moves to `<main>`, next Tab reaches the first cart link.

**Accessibility.**

- Stepper: − to 1 and + to 10 (Enter ×8) leave focus on the quantity input, never `<body>`.
- Remove first of two lines → focus on the remaining line's Remove; remove the last → focus on "Your cart is empty"; the single status region survives the switch and says "Removed Zenhaven. Cart total $0".
- Keyboard pass on `/`: logo → cart → radio group (arrows switch mattress and URL) → Add to Cart (Space works) → View cart. `/cart`: Tab/Enter on stepper, Remove, links.
- Header cart link measures 44×44. Contrast: button 4.9:1, badge 5.1:1, selected segment 5.1:1 (computed), muted text 4.9:1 on the surface.
- Skeletons are `role="status"` with hidden "Loading mattresses…" / "Loading your cart…".

**Responsive.** 375, 768 and desktop on `/` and `/cart` (full): `scrollWidth === innerWidth` at every size; notice fits at 375. Viewport reset to desktop afterwards.

**Images.** All three files are 1268×698. Switching Classic / Loom & Leaf / Zenhaven in the browser shows the bed at the same size and position with nothing cut off. Note: after overwriting the files the dev image optimizer cache (`.next/dev/cache/images`) still served the old crops until cleared.

**Loading feel.** Production build (`next build && next start`): instrumented three client navigations `/` ↔ `/cart`; no `.skeleton-screen` ever reached opacity > 0.

**Console.** Fresh tab against the production build, full flow (add, `/cart`, reload): "No console logs". Dev-mode tabs showed only HMR reconnects from my server restarts, server errors forwarded from the deliberate failure tests, the intentional 404, and one dev-only LCP hint for the Zenhaven image.

**Not verified in the browser.** `app/error.tsx` (no natural way to trigger an unexpected render error); it type-checks and the retry follows the Next.js `router.refresh()` + `reset()` pattern.

**Follow-up fixes, verified 2026-11-16.** Both builds pass. Stub upstream on :4101 with the BFF from `dist` on :4002: duplicate handle (`dup` / ` DUP `) → first kept; `Active` sells; `DISCONTINUED` dropped silently; `pending` dropped and logged; blank name, `../x` and missing image keys dropped and logged; catalog down → 503 after 2 attempts; upstream unreachable → 503 after 2 attempts; `/api/nope` → 404 JSON. Browser (dev): cart seeded with 3× a retired id plus Zenhaven → notice "3 items are no longer available…", badge 1, `/cart` shows only Zenhaven with no second notice; add, quantity and remove flows work; no console errors. `npm audit` shows 2 moderate warnings from the existing `minimatch` dependency.

**Code review fixes (critical), re-verified as above:** currency code validation (BFF), `getProducts()` body check (web), `error.tsx` retry refetching server data. Docs corrected for the real retry worst case (~4.15 s, not ~2.3 s).

## Review

### Scope changes during implementation

- **Selected segment darkened** to `#736e67` (was `#a8a39c`, 2.5:1 with white). Found in the contrast audit; same treatment as the button and badge.
- **Cart thumbnails use the image ratio (634:349) at every width.** The mobile 4:3 box cropped the normalized Zenhaven image.
- **`ProductsService` skips bad catalog/content entries** (not objects, no handle) instead of crashing.
- **`getProducts()` in `lib/api.ts`** replaces the two inline `apiGet` calls in the pages and rejects a body without a `products` array.
- **`main` is focusable** (`id="main" tabIndex={-1}`, no outline) so dismissing the notice has a focus target.
- **Worst-case BFF time** is ~4.15 s (slow 5xx then a timed-out retry), not ~2.3 s. Still under the web's 5 s.

### Code review

Two `/code-review` passes over the whole application after Phase 5 (path targets as planned; `services/upstream/` excluded). 20 findings: 3 critical, 12 medium, 5 low.

**Fixed**

| Severity | Where | Finding | Fix |
| --- | --- | --- | --- |
| Critical | `upstream.client.ts` | Any string accepted as currency; `""` crashes `Intl.NumberFormat` in the web | Currency must be a three-letter code, else 503 |
| Critical | `app/page.tsx`, `cart/page.tsx` | A 200 without `products` threw past the page's try | `getProducts()` checks the body |
| Critical | `app/error.tsx` | "Try again" only called `reset()`, no refetch | `router.refresh()` + `reset()` in a transition |
| Medium | `product.mapper.ts` | `displayName` / `imageKey` unchecked → "undefined Mattress" | Blank name or non-slug image key drops the product |
| Medium | `products.service.ts` | Duplicate handles gave two products one `id` | First wins, rest logged |
| Medium | `products.service.ts` | `discontinued` check case-sensitive; unknown statuses sold | Only `active` (any case) sells |
| Medium | `CartProvider.tsx` | Notice counted lines but said "items" | Counts units |
| Medium | `CartView`, `ProductConfigurator` | Prune effect duplicated | Shared `usePruneCart(products)` |
| Low | mapper / service | Pricing resolved twice | `toProduct` takes the resolved pricing |

**Declined (not needed for this exercise; keeps the code plain)**

| Where | Finding | Why declined |
| --- | --- | --- |
| `upstream.client.ts` | No overall deadline across the retry | Only matters if `UPSTREAM_TIMEOUT_MS` is raised above ~2.4 s; documented |
| `upstream.client.ts` | Retries non-transient 5xx (501, 505) | The mock only returns 503; a status list would add code for no visible gain |
| `app/layout.tsx` | No `global-error.tsx` | Layout errors are an edge case; `error.tsx` covers the pages |
| `HeaderCart.tsx` | Badge counts retired ids on pages that don't prune | Corrects itself on `/` and `/cart`; fixing it means moving product data into the provider |
| `QuantityStepper.tsx` | Typing "10" briefly commits 1 | Ends in the right value; changing input semantics is a UX decision beyond hardening |
| Low | 5 minor style and micro-optimization suggestions | Not worth the extra code (over-long lines were reformatted) |

_Developer review notes go below._

Accepted 2026-11-16 (approved in chat while planning Phase 6).
