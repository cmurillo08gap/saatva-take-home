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
- Navigation loading feel (from Phase 4 review): the skeleton flashes when moving between `/` and `/cart` because each route fetches `/api/products` with `no-store`. Options: a progress bar, keeping the previous page until ready, or short-lived caching of the product list.
- Image consistency (from Phase 4 review): `classic-carousel.jpg` is 634×349 while the other two are 1680×640, so `object-fit: cover` crops them differently and Classic looks softer. The files are provided assets; choose a shared aspect ratio and `object-position`, or accept it and document it.
- Confirm the console is clean in a profile without extensions (the "asynchronous response" error seen in review is an extension message).
- Candidate (from Phase 2): defense in depth for the description HTML, either a second sanitizer in web or a Content Security Policy with Trusted Types. Today the BFF sanitizer is the only guard before `RichText`.

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
