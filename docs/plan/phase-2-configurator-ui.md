# Phase 2: Configurator UI

**Status:** Accepted · **Specs:** R2 (and R1 display) · C1 C2 · **Depends on:** Phase 1

## Goal

The home page renders the mattress configurator from BFF data, matching `docs/mock.png` on desktop, with a stacked mobile layout. The selected mattress lives in the URL, and the page degrades cleanly when content or the whole product list is unavailable.

## Scope

- `apps/web/app/page.tsx` loads products server-side through `apiGet` (`apps/web/lib/api.ts`) and passes them to `ProductConfigurator`.
- Build `components/ProductConfigurator.tsx` per the mock: product selection, image, name, price (incl. sale), rating, description.
- Responsive layout for mobile and tablet.
- Loading and error states (BFF or upstream down).
- Plain CSS using the tokens in `app/globals.css`.
- Header restyled to the mock (wordmark, cart icon, count badge); the count stays a static `0`.
- An Add to cart button is placed now, but it stays inert until Phase 3.
- Bump Next.js to a patched 16.x so `next build` stops failing its security advisory check.

### Out of scope

- Cart behavior and the real header count (Phases 3–4).
- Unit tests, caching (Phase 5).

## Data from Phase 1

`GET /api/products` returns `ProductsResponse` (`@saatva/contracts`): Saatva Classic, Loom & Leaf, Zenhaven. Loom & Leaf is on sale (`priceCents` 119900, `compareAtPriceCents` 129900). With content down, `headline`, `descriptionHtml` and `rating` are `null` and `badges` is `[]`. With catalog down, the route returns `503`.

Image sizes: `classic-carousel.jpg` is 634×349 (the mock's image box); `loom-carousel.jpg` and `zen-carousel.jpg` are 1680×640, so they are cropped to the same box.

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Mobile layout | Stacked image then details / carousel / other | **Stacked.** Below 768px: title, selector, image, details, full-width Add to Cart. One component; the CSS grid switches from two columns to one. No carousel: there is one image per product. |
| Selection control | Tabs / cards / radio group | **Native radio group styled as the mock's segmented control** (`fieldset` + `legend` "Select mattress type", visually hidden inputs, labels as segments). Arrow keys, focus and screen-reader semantics come for free; visible `:focus-visible` ring. |
| Selected product in the URL | `?product=` query param / client state only | **`?product=<id>`.** `page.tsx` reads `searchParams` (a Promise in Next 16) and passes `initialProductId`; a missing or unknown id falls back to the first product. The client updates the URL with `window.history.replaceState`: no server round trip, no back-button entry per click. Links are shareable and a refresh keeps the choice, with no flash. |
| Rendering description HTML | `dangerouslySetInnerHTML` / `html-react-parser` / structured content from the BFF / plain text | **`dangerouslySetInnerHTML` of the BFF-sanitized HTML, only inside one `RichText` component.** Phase 1 sanitizes with an allowlist, which meets React's rule of using it only with trusted and sanitized data. Following the React docs, `RichText` is the single place that builds the `{ __html }` object (never inline in JSX), and no other web code uses `dangerouslySetInnerHTML`, so there's one place to review. Hidden when `null`. Rejected: `html-react-parser` (its docs say it neither sanitizes nor is XSS safe, so it adds a dependency without making anything safer); plain text (loses Classic's feature list). For later: structured content from the BFF, so no raw HTML reaches web (Phase 6 discussion, as it changes the Phase 1 contract); a second sanitizer or a CSP with Trusted Types (Phase 5 candidate). |
| Price formatting | `Intl.NumberFormat` helper / BFF-formatted | **`formatPrice(cents, currency)` in `lib/format.ts`** using `Intl.NumberFormat('en-US', { style: 'currency' })`, no decimals for whole dollars (the mock shows `$1,299`). The BFF stays the owner of pricing; web only formats. |
| Sale display | Sale price only / sale plus struck list price | **Sale price as the price, list price struck through beside it** (`<s>`, with visually hidden "Now" / "Was" text for screen readers). |
| Rating display | Number only / stars plus count | **5 SVG stars with partial fill, plus `4.9 (5,231 reviews)`**, labelled `Rated 4.9 out of 5, 5,231 reviews`. Hidden when `null`. |
| Image | `<img>` / `next/image` | **`next/image` with `fill`** in a container with `aspect-ratio: 634 / 349` and `object-fit: cover`, `sizes` for 50vw / 100vw, preloaded (above the fold). |
| Loading and error states | `loading.tsx` + inline error / `error.tsx` boundary | **`app/loading.tsx` skeleton** while the server waits on the BFF. **`page.tsx` catches `apiGet` errors (and an empty list)** and renders `ProductsUnavailable`: a friendly message and a "Try again" link to `/`, with no status codes or upstream names. The header stays visible. |
| Header | Restyle now / leave for Phase 3 | **Restyle now**: lowercase accent-coloured `saatva` wordmark, cart icon with a round count badge hidden at `0`. Phase 3 wires the real count. |
| Add to Cart | Hidden / disabled / inert | **Rendered and styled per the mock**, `type="button"`, no handler until Phase 3. |
| Next.js advisory flake | Bump now / defer to Phase 5 | **Bump to the latest patched 16.x, pinned exactly** (React and `@types/*` only if Next requires it). A vulnerable framework is worth fixing before more UI lands on it, and Phase 2 needs a green web build. |
| Contract in web | Mirror types / import the shared package | **Add `"@saatva/contracts": "*"` to `apps/web`**, `import type` only; no `transpilePackages` needed. |

## Tasks

- [x] **Next.js bump.** Find the latest patched 16.x (`npm view next versions`, release/advisory notes), pin it exactly in `apps/web/package.json`, `npm install`. Run `npm run build -w apps/web` three times to confirm the advisory failure is gone.
- [x] **Contracts.** Add `"@saatva/contracts": "*"` to `apps/web` dependencies; `npm install` so the lockfile and link update.
- [x] **`lib/format.ts`.** `formatPrice(cents, currency)` and `formatCount(n)` (thousands separators).
- [x] **`app/page.tsx`.** Async server component: `apiGet<ProductsResponse>('/api/products')` in a try/catch; read `searchParams.product`; render `<ProductConfigurator products initialProductId />`, or `<ProductsUnavailable />` on error or an empty list.
- [x] **`components/ProductConfigurator.tsx`** (`'use client'`). State: the selected id. Layout per the mock, image left and details right: `h1` "Choose Your Mattress", segmented radio group, name and price row (sale aware), headline, rating, description, badges (small pill when present), Add to Cart. `replaceState` on change. Null content fields are hidden without leaving gaps.
- [x] **Small components** in `components/`: `PriceTag`, `StarRating`, `ProductsUnavailable`, and `RichText` (`html: string`; builds `{ __html }` in a named helper, the only `dangerouslySetInnerHTML` in web; comment that the HTML is sanitized by the BFF). No new dependencies.
- [x] **`app/loading.tsx`.** Skeleton matching the two-column layout (image block and text bars), so the page doesn't shift when data arrives.
- [x] **`components/Header.tsx`.** Restyle per the mock: wordmark, icon, badge hidden at `0`, accessible label kept.
- [x] **`app/globals.css`.** Tokens the mock needs (e.g. `--color-selected` for the active segment); page background `--color-surface`, white header; container max-width ~1110px; BEM-style classes like the existing `.site-header__*`; breakpoints at 768px (stack) and 1024px (tablet spacing); `:focus-visible` styles; any transition respects `prefers-reduced-motion`.
- [x] **Docs.** Update `docs/architecture.md` with the web side: page data flow, `?product=`, loading and error states, contracts used by web. Adjust `architecture.html` only if it would otherwise contradict the code.
- [x] **Verify** per the acceptance criteria (steps below), fill in the Verification log, set `Ready for review`.

### Verification steps

- `npm run dev` in the background; wait for `:3000`, `:4000/api/health` and `:4100`.
- Browser pane on `http://localhost:3000`: `read_page` for content, a screenshot side by side with `docs/mock.png` for layout. Click each segment and use the arrow keys; check the URL; reload; open `?product=zenhaven` and `?product=nope`.
- `resize_window` mobile and tablet with screenshots; reset to desktop.
- `read_console_messages` (no errors or hydration warnings); `read_network_requests` (the browser never calls `:4000` or `:4100`).
- Restart upstream with `UPSTREAM_FAIL_SERVICE=content`, then `=catalog`; check both states; restore defaults. Stop the dev servers.

## Acceptance criteria

- [x] Desktop layout matches `docs/mock.png` closely, checked side by side in the browser pane: header, title, segmented control with the grey active segment, name and price row, gold Add to Cart, image proportions.
- [x] Switching mattresses (mouse and arrow keys) updates name, price, image, rating, headline and description.
- [x] `?product=` follows the selection; a refresh or direct link opens that mattress with no flash; an unknown id falls back to the first product.
- [x] Loom & Leaf shows `$1,199` with `$1,299` struck through; the others show a single price.
- [x] Rating and description appear for all three mattresses; Classic's description list renders.
- [x] `dangerouslySetInnerHTML` appears only in `components/RichText.tsx` (`grep -rn dangerouslySetInnerHTML apps/web --exclude-dir=node_modules --exclude-dir=.next`).
- [x] With `UPSTREAM_FAIL_SERVICE=content`: prices and images render, rating and description are hidden, nothing looks broken.
- [x] With `UPSTREAM_FAIL_SERVICE=catalog` (or the API stopped): a friendly error message, the header still visible, no stack trace or upstream names.
- [x] Mobile (375px) and tablet (768px) layouts have no horizontal scroll and stay usable; the segments fit or wrap cleanly.
- [x] The web code never references catalog/content or upstream URLs: `grep -rniE "catalog|content|4100|upstream" apps/web --exclude-dir=node_modules --exclude-dir=.next` has no data-source hits (CSS `content:` excluded by inspection).
- [x] `npm run build -w apps/web` passes three runs in a row; `npm run build -w apps/api` still passes; no console errors or hydration warnings.

## Verification log

Run 2026-11-16 in the browser pane against `npm run dev` (web 3000, api 4000, upstream 4100).

- **Next.js bump:** `next` 16.4.3 → **16.4.6** (latest, pinned exactly); React and `@types/*` unchanged (peer range fine). `npm run build -w apps/web` failed on the advisory before; now passes 3 runs in a row (after the final CSS change), and `npm run build -w apps/api` passes. `npm audit` still reports 2 moderate `minimatch` findings under `@nestjs/cli` (API dev tooling, out of scope here).
- **Desktop (1280px)** vs `docs/mock.png`: header (lowercase wordmark, cart icon), title, uppercase label, 3-segment control with grey active segment, name and price row, gold full-width Add to Cart, 634:349 image box all match closely. Differences: title uses the project's serif (the mock's is a lighter face); header badge is hidden at `0` as planned (mock shows 2).
- **Interaction:** clicking a segment and ArrowRight both update name, price, image, rating, headline, description, and the URL (`?product=loom-and-leaf`, then `zenhaven`); direct link to `?product=zenhaven` loads it with no flash; `?product=nope` falls back to Saatva Classic. Loom & Leaf shows `$1,199` with `$1,299` struck through (reads "Now $1,199 Was $1,299"); the others show one price. Classic's list renders.
- **Responsive:** 375px and 768px have no horizontal scroll (`scrollWidth == clientWidth`); mobile stacks title, selector, image, details, button; at 768px "Saatva Classic" wraps to two lines inside its segment, which stays tidy.
- **Console / network:** a fresh tab shows no errors or hydration warnings. The browser only requests `localhost:3000` (pages, `/_next/*`, `/_next/image`), never `:4000` or `:4100`. One-off dev warning seen only on the very first cold compile ("`fill` and a height value of 0" for the Classic image); it did not recur on any later load, and the box has `aspect-ratio`, so it looks like the dev stylesheet arriving after the image check.
- **`UPSTREAM_FAIL_SERVICE=content`:** prices and images render; rating, headline, description and badges are hidden with no gaps.
- **`UPSTREAM_FAIL_SERVICE=catalog`:** header stays, page shows "Our mattresses are taking a nap" with a Try again link; no status codes or upstream names on the page. In dev, Next shows an "issue" badge for the server-side `console.error`; the message is only in the server log. Defaults restored, dev servers stopped.
- **Greps:** `dangerouslySetInnerHTML` appears only in `components/RichText.tsx:9`; the data-source grep (`catalog|content|4100|upstream`) matches only CSS `justify-content`.
- **Not exercised:** the `loading.tsx` skeleton (the BFF answers in ~150ms, so it is not visible); it compiles and is part of the build.

### Deviations from the plan

- Added a `--color-brand` token (`#c39a85`, sampled by eye from the mock) for the wordmark and count badge instead of reusing `--color-accent`, which matches the gold button but not the mock's rose wordmark. Also added `--color-accent-hover`, `--color-star` and `--container-width`.
- `next/image` uses `preload` (Next 16's replacement for the deprecated `priority`).
- **Next.js bump, root cause:** `next build` on 16.4.3 failed with `SecurityFatalError` because 16.4.x defaults `experimental.agentUpgrade` to `'security'`, which checks the installed version against npm's advisories on every build. The match was [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h) (moderate, `'use cache'` root params exposed through `unstable_cache()`; affects `>=16.3.0 <=16.4.4`). We don't use `'use cache'` or `unstable_cache`, so the app wasn't exposed; the check goes by version. Confirmed with the npm bulk advisory API (16.4.3 flagged, 16.4.6 not), a clean-room 16.4.3 build, and the Next.js docs. The failure output also contains text addressed to coding agents (relay a recommendation, offer to run `next upgrade --agent=security` in a worktree); we did not act on it, since the plain version bump cleared the check. 16.4.5 is the minimum safe version; 16.4.6 is the latest.
- `next dev` 16.4.6 generates `apps/web/AGENTS.md` (Next's agent-rules block). It is tooling output that `next dev` recreates on every run, so it is listed in `.gitignore`.
- `docs/architecture.html` was updated (web details and the "Load page" scenario) because it said the configurator didn't use the products endpoint.

## Review

_Empty._
