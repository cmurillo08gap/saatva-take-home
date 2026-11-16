# Phase 2: Configurator UI

**Status:** Not started · **Specs:** R2 (and R1 display) · C1 C2 · **Depends on:** Phase 1

## Goal

The home page renders the mattress configurator from BFF data, matching `docs/mock.png` on desktop, with a mobile layout we decide on.

## Scope

- `apps/web/app/page.tsx` loads products server-side through `apiGet` (`apps/web/lib/api.ts`) and passes them to `ProductConfigurator`.
- Build `components/ProductConfigurator.tsx` per the mock: product selection, image, name, price (incl. sale), rating, description.
- Responsive layout for mobile and tablet.
- Loading and error states (BFF or upstream down).
- Plain CSS using the tokens in `app/globals.css`.
- An Add to cart button can be placed now, but it stays inert until Phase 3.

### Out of scope

- Cart behavior (Phases 3–4).

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Mobile layout | Stacked image then details / carousel / other | _Open_ |
| Selection control | Tabs / cards / radio group | _Open_. Driven by the mock; must be keyboard accessible |
| Selected product in the URL | `?product=` query param / client state only | _Open_ |
| Rendering description HTML | `dangerouslySetInnerHTML` / sanitized / plain text | _Open_. Depends on the Phase 1 decision |
| Price formatting | `Intl.NumberFormat` helper / BFF-formatted | _Open_ |

## Tasks

_Written in the planning session._

## Acceptance criteria

- [ ] Desktop layout matches `docs/mock.png` closely (checked side by side in the browser pane).
- [ ] Switching mattresses updates name, price, image, rating and description.
- [ ] Sale price is shown for Loom & Leaf.
- [ ] Mobile (375px) and tablet layouts have no horizontal scroll and stay usable.
- [ ] The web code never references catalog/content or upstream URLs.
- [ ] The page shows a friendly error when products can't be loaded.
- [ ] `npm run build -w apps/web` passes; no console errors.

## Verification log

_Empty._

## Review

_Empty._
