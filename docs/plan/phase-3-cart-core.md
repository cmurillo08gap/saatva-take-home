# Phase 3: Cart core

**Status:** Not started · **Specs:** R3 R7 · C3 (C1 if the cart goes through the BFF) · **Depends on:** Phase 1, Phase 2

## Goal

Decide how the cart is stored, then let a shopper add a mattress to the cart, see the header count update, and keep the cart after a page refresh.

## Scope

- Cart storage decision (the first thing in the planning session, recorded in the README decision log).
- Add to cart from the configurator.
- Header cart count in `components/Header.tsx`, kept in sync across the app.
- Persistence across a page refresh.

### Out of scope

- Cart view, quantity changes, removal, totals (Phase 4).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Cart storage | **A.** BFF-owned cart keyed by an httpOnly cookie, in-memory store behind a repository interface / **B.** Browser localStorage only / **C.** Cookie holding the cart contents | _Open_. Recommendation: **A**. The BFF re-prices items from the catalog, so the client never sends prices and totals can be trusted; cart calls also go through the BFF (C1); the store can be swapped for Redis or a DB later. Trade-off: the cart is lost when the BFF restarts. **B** is simpler but leaves prices and validation on the client |
| What a cart line stores | Product id + quantity / snapshot of price and name | _Open_ |
| Client cart state | React context / small store / server components with refresh | _Open_ |
| Header count with server rendering | Read server-side on render / fetch client-side after hydration | _Open_. Avoid a flash of `0` |

## Tasks

_Written in the planning session, after the storage decision._

## Acceptance criteria

- [ ] Clicking Add to cart adds the selected mattress, and the header count updates without a page reload.
- [ ] Adding the same mattress again increments its quantity instead of adding a duplicate line.
- [ ] After a hard refresh, the header count is still correct.
- [ ] The browser only talks to `web` (`/api/*` via rewrites); no direct BFF or upstream calls.
- [ ] Unknown or unavailable product ids are rejected with a clear error.
- [ ] Builds pass; no console or network errors.

## Verification log

_Empty._

## Review

_Empty._
