# Phase 4: Cart view

**Status:** Not started · **Specs:** R4 R5 R6 · C3 · **Depends on:** Phase 3

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

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Cart surface | `/cart` page / slide-over drawer / both | _Open_ |
| Quantity bounds | Min 1 (remove separately) / 0 removes; max per line | _Open_ |
| Update strategy | Optimistic UI / wait for server response | _Open_ |
| Where totals are computed | Server (BFF) / client | _Open_. Follows the Phase 3 storage choice |

## Tasks

_Written in the planning session._

## Acceptance criteria

- [ ] The cart lists each line with image, name, unit price, quantity and line total.
- [ ] Changing a quantity updates the line total, cart total and header count.
- [ ] Removing a line updates totals and count; removing the last line shows the empty state.
- [ ] Totals use the sale price where active and are correct to the cent.
- [ ] Changes survive a refresh.
- [ ] Usable on mobile and with keyboard only.
- [ ] Builds pass; no console or network errors.

## Verification log

_Empty._

## Review

_Empty._
