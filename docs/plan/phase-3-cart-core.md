# Phase 3: Cart core

**Status:** Accepted · **Specs:** R3 R7 · C3 · **Depends on:** Phase 1, Phase 2

## Goal

A shopper can add a mattress to the cart, see the header count update, and still have the cart after a page refresh. The cart is stored in the browser's localStorage.

## Scope

- Cart storage decision, recorded in the README decision log.
- Add to cart from the configurator.
- Header cart count, kept in sync across the app (and across open tabs).
- Persistence across a page refresh.

### Out of scope

- Cart view, quantity changes, removal, totals (Phase 4).
- Server-side cart, server-rendered count, cross-device carts (Phase 6 discussion: what we'd do with a real data store).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Cart storage | **A.** BFF-owned cart keyed by an httpOnly cookie, in-memory store behind a repository interface / **B.** Browser localStorage only / **C.** Cookie holding the cart contents | **B. localStorage.** Fits the time we have and needs no BFF changes. C1 still holds: the web app never calls upstream, and product data (names, prices) still comes only from the BFF's `/api/products`. Trade-offs, for the C3 discussion: the cart is per browser, the server can't render the count, and a real checkout would have to re-price on the server. **A** remains the upgrade path; all cart access goes through one React context, so switching later doesn't touch components |
| What a cart line stores | Product id + quantity / snapshot of price and name | **Product id + quantity.** Nothing the shopper could edit is ever treated as a price. Name, image and price are joined from the BFF product list when shown, so totals (Phase 4) always use current prices, sale included |
| Client cart state | React context / small store / server components with refresh | **React context.** `CartProvider` in the root layout reads localStorage through `useSyncExternalStore` (stable snapshot, server snapshot is an empty cart, so no hydration mismatch) and listens to the `storage` event for cross-tab sync. No new dependency |
| Header count with server rendering | Read server-side on render / fetch client-side after hydration | **Client-side after hydration** (forced by B). The server snapshot is an empty cart, so no badge renders until hydration; the badge appears with the real count instead of flashing `0` |
| Unknown / stale product ids | Reject at add / prune on read | **Both.** `addItem` only accepts a product from the BFF list. Lines read from storage that are malformed are dropped; ids no longer in the product list are pruned wherever that list is available (configurator now, cart page in Phase 4) |
| Max quantity per line | None / cap | **Cap at 10** (one constant). Adding beyond it shows a message instead of adding. Phase 4 revisits quantity bounds |

## Tasks

- [x] **Cart storage module** `apps/web/lib/cart.ts` (pure, no React): types `CartLine { productId: string; quantity: number }` and `Cart { lines: CartLine[] }`; storage key `saatva.cart.v1`; `parseCart(raw)` (bad JSON or wrong shape → empty cart, invalid lines dropped, quantities clamped to 1–`MAX_QUANTITY_PER_LINE`, duplicate ids merged); `addLine(cart, productId)` (increments an existing line, refuses past the cap); `pruneCart(cart, validIds)`; `cartCount(cart)` (sum of quantities). `readCart` / `writeCart` wrap localStorage in try/catch: when storage is unavailable or full, the cart keeps working in memory for the session and a warning is logged.
- [x] **`CartProvider` + `useCart()`** `apps/web/components/CartProvider.tsx` (`'use client'`): a small external store over `lib/cart.ts` (`subscribe` covers in-tab writes and the `storage` event; `getSnapshot` caches the parsed cart by its raw string so the reference is stable). Exposes `cart`, `count`, `hydrated`, `addItem(product)` (returns `'added' | 'max'`) and `prune(validIds)`. `useCart()` throws outside the provider.
- [x] **Layout** wraps the header and `<main>` in `CartProvider`.
- [x] **Header**: move the cart icon into a client `HeaderCart` component that reads `count`; badge and `aria-label` ("Cart, N items") follow the count; no badge before hydration or at `0`. `Header` itself stays a server component.
- [x] **Add to Cart** in `ProductConfigurator`: calls `addItem(product)`; an `aria-live="polite"` status says "Added {name} to your cart" or "You can add up to 10 of this mattress"; the configurator calls `prune` with the current product ids on mount.
- [x] **Styles** for the status message in `globals.css`, using the existing tokens.
- [x] **Docs**: update `docs/architecture.md` (cart section, diagram, file list) and the README decision log; Phase 4's "where totals are computed" now follows from this choice.

## Acceptance criteria

- [x] Clicking Add to cart adds the selected mattress, and the header count updates without a page reload.
- [x] Adding the same mattress again increments its quantity instead of adding a duplicate line.
- [x] After a hard refresh, the header count is still correct, with no flash of a wrong count.
- [x] The count stays in sync across two open tabs.
- [x] Cart features make no new network calls; product data still comes only from `/api/products` through the BFF (C1).
- [x] Unknown or unavailable product ids are rejected: a hand-edited or corrupt localStorage value doesn't crash the page, and unknown ids are dropped.
- [x] Adding past 10 of one mattress shows the message and doesn't change the count.
- [x] Screen readers hear the add confirmation and the updated cart label.
- [x] Builds pass; no console errors (including hydration warnings) or network errors.

## Verification log

2026-11-16, built-in browser pane, `npm run dev`; `npm run build -w apps/web` and `-w apps/api` pass.

- Add to Cart: header went `Cart, 0 items` → `1 item` → `2 items` with no reload; the same mattress incremented one line (`{"lines":[{"productId":"saatva-classic","quantity":2}]}`); status read "Added Saatva Classic to your cart".
- Cap: after 10, further clicks kept `Cart, 10 items` and showed "You can add up to 10 of this mattress".
- Refresh: count correct after reload; no console errors or hydration warnings.
- Bad storage: seeded `saatva-classic` ×3, `ghost`, `saatva-classic` ×99 and a numeric id → one line, quantity 10, `ghost` and the invalid line gone from storage after load. Corrupt JSON → `Cart, 0 items`, page renders.
- Network: no new `/api/` requests from cart actions (resource timing shows none beyond the server-rendered page).
- Cross-tab: **simulated** by writing localStorage and dispatching a `storage` event in one tab (count updated 10 → 4); a real two-tab check was not done.
- Not verified: screen-reader output (relies on `role="status"` / `aria-live` and the `aria-label`), and the in-memory fallback when storage is blocked.
- Dev servers stopped.

## Review

_Empty._
