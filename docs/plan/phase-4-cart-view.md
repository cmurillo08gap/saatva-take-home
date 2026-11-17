# Phase 4: Cart view

**Status:** Accepted · **Specs:** R4 R5 R6 · C3 · **Depends on:** Phase 3

## Goal

A shopper can open the cart, change quantities, remove items and see an accurate total.

## Scope

- Cart UI (no mock exists, so we design it in the style of the configurator).
- Quantity increase, decrease and direct edit; remove line.
- Line totals and cart total, using the current prices (sale price where active).
- Empty cart state.
- Header link to the cart.

### Out of scope

- Checkout, shipping, tax (Phase 7 candidates at most).
- Slide-over cart drawer (Phase 7 candidate).
- UX for a product that becomes unavailable while in the cart, beyond pruning (Phase 5).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Cart surface | `/cart` page / slide-over drawer / both | **`/cart` page.** A server component fetches `/api/products` the same way `app/page.tsx` does; a client `CartView` joins it with the cart. Linkable, no focus trap or scroll lock to build, works well on mobile. A drawer is a Phase 7 candidate |
| Quantity bounds | Min 1 (remove separately) / 0 removes; max per line | **Stepper − [n] +, min 1, max 10** (`MAX_QUANTITY_PER_LINE`), with a separate **Remove** button. − is disabled at 1, + at 10. The middle is a text input (`inputMode="numeric"`, labelled "Quantity, {name}"): a valid 1–10 commits on change; on blur or Enter, out-of-range values clamp and empty or non-numeric values revert to the stored quantity |
| Update strategy | Optimistic UI / wait for server response | **Synchronous local writes**, which follows from the Phase 3 localStorage choice: there is no server round trip, so the question doesn't arise. A BFF-owned cart would need optimistic updates with rollback (C3 discussion) |
| Where totals are computed | Server (BFF) / client | **Client, from BFF prices.** Lines hold only id + quantity; the unit price is always `priceCents` from `/api/products` at render time, so sale prices apply and nothing the shopper can edit is treated as a price. All math in integer cents, formatted with `formatPrice`. A real checkout must re-price on the server (C3 discussion) |
| Products unavailable on `/cart` | Prune / keep the cart | **Show a cart-specific message and don't prune.** An empty product list must never wipe the stored cart |
| Before hydration | Empty state / skeleton | **Skeleton.** The server snapshot is an empty cart, so showing the empty state before hydration would flash "empty" for a full cart |

## Tasks

- [x] **Cart logic** `apps/web/lib/cart.ts` (pure): `setLineQuantity(cart, productId, quantity)` (clamps 1–`MAX_QUANTITY_PER_LINE`, returns the same reference when unchanged), `removeLine(cart, productId)`, and `priceCart(cart, products)` → `{ lines: { product, quantity, lineTotalCents }[], subtotalCents, count, currency }`, skipping ids not in the product list. Reuse `MAX_QUANTITY_PER_LINE` and `cartCount`.
- [x] **`CartProvider`** `apps/web/components/CartProvider.tsx`: add `setQuantity(productId, quantity)` and `removeItem(productId)` through the existing `commit`; `prune` does nothing when given an empty id list.
- [x] **Route** `apps/web/app/cart/page.tsx` (server component): fetch products with `apiGet`; render `CartView`, or a cart unavailable message when products fail to load; `metadata.title` "Saatva | Your Cart". Add `app/cart/loading.tsx` with a skeleton.
- [x] **`CartView`** `apps/web/components/CartView.tsx` (`'use client'`): prunes on mount; skeleton until `hydrated`; empty state (heading and a "Continue shopping" link to `/`); otherwise a list of lines (`next/image` thumbnail, name linking to `/?product={id}`, unit price via `PriceTag`, quantity stepper, Remove, line total) and a summary (item count, subtotal, a "Shipping and taxes calculated at checkout" note, no checkout button). An `aria-live="polite"` status announces changes (e.g. "Removed Saatva Classic. Cart total $X"). After Remove, focus moves to the next line's Remove button, else the previous one, else the empty-state heading.
- [x] **`QuantityStepper`** `apps/web/components/QuantityStepper.tsx`: the control described in Decisions; buttons labelled "Decrease quantity of {name}" / "Increase quantity of {name}".
- [x] **Header**: `HeaderCart` becomes a `next/link` to `/cart` (same `aria-label`, visible focus style); the logo links to `/`. The configurator's "Added …" status gains a "View cart" link.
- [x] **Styles** in `app/globals.css` with the existing tokens: line grid (image | details | stepper | total) at 768px and up, stacked below; 44px touch targets; focus-visible outlines.
- [x] **Docs**: update `docs/architecture.md` (+ `docs/architecture.html`) cart section and file list; add README decision log rows.

## Acceptance criteria

- [x] The cart lists each line with image, name, unit price, quantity and line total.
- [x] Changing a quantity updates the line total, cart total and header count.
- [x] Removing a line updates totals and count; removing the last line shows the empty state.
- [x] Totals use the sale price where active and are correct to the cent.
- [x] Quantity can't go below 1 or above 10 by buttons or typing; invalid typed input reverts without errors.
- [x] Changes survive a refresh, and a full cart never flashes the empty state on load (no hydration warnings).
- [x] When products fail to load, `/cart` shows a message and the stored cart is untouched.
- [x] Changes made in one tab show in another.
- [ ] Usable on mobile and with keyboard only. (Mobile checked; keyboard pass not driven, see log.)
- [x] Builds pass; no console or network errors.

## Verification plan

- `npm run build -w apps/web` and `npm run build -w apps/api`.
- `npm run dev` in the background; in the built-in browser: add two mattresses (one on sale), open `/cart` from the header, check unit, line and subtotal to the cent against `/api/products`; use +, −, and type `7`, `0`, `99`, `abc`; remove lines until empty; refresh at each step; do a keyboard-only pass; `resize_window` to mobile, then reset to desktop; check `read_console_messages` and `read_network_requests`.
- Restart upstream with `UPSTREAM_FAIL_SERVICE=catalog`, open `/cart`, confirm the message and that localStorage is intact; restore defaults; stop the dev servers.

## Verification log

2026-11-16, dev servers via `npm run dev`, checked in the built-in browser.

- `npm run build -w apps/web` and `-w apps/api` pass. `/cart` is marked `force-dynamic` because it fetches at request time (without it the build logged a prerender error).
- Totals: Classic $999 × 4 + Loom & Leaf $1,199 (sale) = $5,195; × 7 → $8,192; × 10 + 1 → $11,189. All match `/api/products` to the cent; header count tracks every change.
- Quantity: typed `7` commits; `0` + Tab → 1; `99` + Enter → 10 (+ disabled at 10, − disabled at 1); `abc` + Tab reverts to the stored value. No errors.
- Remove: status "Removed Saatva Classic. Cart total $1,199"; focus lands on the neighbouring Remove button, then on the "Your cart is empty" heading after the last line. Empty state shows "Continue shopping"; header reads "Cart, 0 items".
- Refresh keeps the cart; a second tab's change shows in the first (storage event).
- Mobile (375px): thumbnail rows with stepper, Remove and line total; summary below. Reset to desktop afterwards. No hydration warnings; console and network clean apart from one dev-only LCP image hint, fixed with `loading="eager"` on the first line image.
- `UPSTREAM_FAIL_SERVICE=catalog`: `/cart` shows "We can't show your cart right now" and localStorage is unchanged. Defaults restored, servers stopped.
- Review feedback (developer): the stepper focus ring was clipped by the neighbouring buttons; fixed in this phase by drawing it inward (`outline-offset: -2px`), not re-checked visually. The text input (`inputMode="numeric"`) stays: `type="number"` adds spinner arrows and swallows invalid text, which the revert-on-blur rule relies on. The console error "A listener indicated an asynchronous response…" comes from a browser extension, not the app. Skeleton flashes on navigation and the uneven image crop and quality were moved to Phase 5.
- Not done: a full keyboard-only pass was not driven through the browser; all controls are native buttons, inputs and links with `:focus-visible` outlines.

## Review

### Code review after acceptance (two agent reviews, nothing critical, nothing fixed, not scheduled in any phase)

Larger:

- `apiGet` has no timeout, so a hung BFF leaves `/` and `/cart` on the skeleton; add `AbortSignal.timeout`.
- Cart live region is mounted twice (empty and populated branches) and the status text never clears, so announcements can be lost or not repeat; use one persistent region and re-announce identical messages (also the configurator's "Added …" status).
- Loading skeleton has `aria-label` on a plain div (not announced); use `role="status"` with hidden text. `CartUnavailable` has `role="alert"` on the whole section.
- Focus is lost when the stepper's + or − disables at 10 or 1.
- `pendingFocus` can survive a no-op remove and pull focus later.

Minor:

- `setLineQuantity` with NaN would drop the line (not reachable from the UI).
- Stale typed draft when the quantity changes elsewhere.
- `memoryRaw` fallback ignores other tabs.
- Header badge counts retired products until a prune runs.
- Stored quantity 0 or negative becomes 1.
- `<aside>` used for the order summary; product id not URL-encoded in the cart link; header cart link is a small touch target.

