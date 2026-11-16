# Phase 5: Hardening

**Status:** Not started · **Specs:** quality pass over R1–R7 · **Depends on:** Phase 4

## Goal

The app behaves well when things go wrong and holds up on accessibility and responsive checks.

## Scope

- Upstream failures, checked with `UPSTREAM_FAIL_SERVICE=catalog|content` and `UPSTREAM_FAILURE_RATE` (and slow responses via `UPSTREAM_LATENCY_MS`).
- BFF down while the web app is up.
- Edge cases: quantity bounds, invalid input to cart routes, a product that becomes unavailable while in the cart, an expired or unknown cart id.
- Accessibility pass: keyboard navigation, focus states, labels, live region for the cart count, contrast.
- Responsive pass: mobile, tablet, desktop.
- BFF input validation and consistent error responses.

### Out of scope

- New features (Phase 7).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Timeouts and retries toward upstream | None / timeout only / timeout + retry | _Open_ |
| Caching of product data in the BFF | None / short in-memory TTL | _Open_ |
| Unavailable product in cart | Remove silently / keep and flag / block checkout | _Open_ |

## Tasks

_Written in the planning session._

## Acceptance criteria

- [ ] Each failure mode above shows a clear message in the UI, and no process crashes.
- [ ] Invalid cart requests get 4xx responses with a consistent error body.
- [ ] All interactive elements are reachable and usable by keyboard.
- [ ] No horizontal scroll at 375px; layouts hold at tablet and desktop.
- [ ] Upstream env vars are restored to defaults after testing.

## Verification log

_Empty._

## Review

_Empty._
