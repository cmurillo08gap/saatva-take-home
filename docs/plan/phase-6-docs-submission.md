# Phase 6: Docs and submission

**Status:** Ready for review · **Specs:** C3 discussion, submission requirements · **Depends on:** Phase 5 (Phase 7 skipped)

## Goal

The repo is ready to send: it runs from a clean checkout, and the docs explain what we built, why, and what we'd change with more time.

## Scope

- Final pass on `docs/architecture.md` (the living doc that extends the frozen `docs/base-architecture.md`) and `docs/architecture.html`, so both match the code.
- A root `NOTES.md` for the reviewers: how to run, what we built, trade-offs, known limitations, "with more time". It pulls from the decision log and the phase Review sections; it doesn't repeat `architecture.md`, it links to it.
- One line at the top of `README.md` pointing to `NOTES.md`. The rest of the brief stays as Saatva wrote it.
- "With more time" notes carried from earlier phases:
  - C3: a BFF-owned cart (session cookie id, server store, server-side re-pricing at checkout), and what changes with a real data store.
  - Phase 2: the BFF could send the description as structured content instead of HTML.
  - Phase 5: a Content Security Policy as defense in depth for the description HTML.
  - Phase 5: product images cropped once to 1268×698 so they frame the same.
  - Phase 7 candidates (skipped): sizes with per-size pricing, cart drawer, BFF caching, SEO metadata, unit tests, structured logging with request ids.
- `CLAUDE.md` pointer to `NOTES.md`; phase plan stays in `docs/plan/`.
- Clean checkout check: fresh clone of the pushed repo, `npm install && npm run dev`, full shopper flow.

### Out of scope

- Features (Phase 7 was skipped).
- Code changes beyond small fixes found during the clean checkout check; any such fix is listed in Review.
- Pushing to GitHub: the developer pushes. The clean checkout check runs on a local clone of the committed tree.

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Ship `docs/plan/` with the submission | Keep / remove | **Keep.** Shows the spec-driven process and the decision log; useful in the pairing session |
| Submission format | Public GitHub repo / zip | **Public GitHub repo**, the existing `origin` (already public) |
| Where the write-up lives | README section / root `NOTES.md` / docs only | **Root `NOTES.md`**, linked from one line atop `README.md`, so the brief stays intact and the notes are one click away |
| `.mcp.json` | Keep / remove | **Keep.** The context7 MCP config stays for working on the repo with Claude Code |
| Phase 7 | Run / skip | **Skipped.** No features beyond R1–R7; candidates become talking points |

## Tasks

- [x] **Architecture doc pass.** Walk `apps/api/src`, `apps/web/{app,components,lib}` and `packages/contracts` against `docs/architecture.md`: diagram nodes and edges, "Where things are", configuration table, failure tables. Fix drift only.
  - Reconcile the error-body wording: the Phase 5 decision log says "Nest default error body via a global filter", `architecture.md` says "No custom filter". Check the code and make both say what it does.
- [x] **`docs/architecture.html`.** Bring the interactive diagram in line with the `.md` (same components and flows). Open it in the browser pane and check it renders without console errors.
- [x] **`NOTES.md`** (root), short and scannable, neutral "we" wording:
  1. Run it: `nvm install && npm install && npm run dev`, the three URLs, the failure env vars for trying outages.
  2. What we built: R1–R7 in one line each, with where it lives.
  3. Key decisions and trade-offs: merged products endpoint and catalog-decides-sellable, integer cents, BFF sanitization, `@saatva/contracts`, cart in `localStorage` with ids only, failure handling (timeout, one retry, degrade on content outage), accessibility (AA contrast, focus management, live regions), mobile layout.
  4. Cart storage (C3): why `localStorage`, its limits (per browser, no server-rendered count, client-side totals), and the real-data-store design (cart id cookie, BFF cart endpoints, store such as Redis or Postgres, re-price and validate on the server, merge on login, TTL for abandoned carts).
  5. Known limitations: only the review findings still open in the code, one line each (most of the Phase 4 post-acceptance list was fixed in Phase 5; check each against the code before listing it):
     - In-memory cart fallback (`memoryRaw`, used when `localStorage` is unavailable) doesn't sync other tabs.
     - Header badge counts retired products until a page prunes the cart.
     - No overall deadline across the upstream retry (only matters if `UPSTREAM_TIMEOUT_MS` is raised above ~2.4 s).
     - Any 5xx is retried, including non-transient ones (501, 505).
     - No `global-error.tsx` for errors in the root layout.
     - Typing "10" in the quantity stepper briefly commits 1 before settling on 10.
  6. With more time: the carried notes above plus the Phase 7 candidates; tests first (cart reducer, mapper, upstream client).
  7. How we worked: link to `docs/plan/README.md` (phases, decision log) and `docs/architecture.md`.
- [x] **`README.md`**: one line under the title: "Submission notes: see [`NOTES.md`](NOTES.md)." Nothing else changes.
- [x] **`CLAUDE.md`**: mention `NOTES.md` next to the architecture docs.
- [x] **Builds**: `npm run build -w apps/api` and `npm run build -w apps/web` pass.
- [x] **Clean checkout check** (after the developer commits the phase, or on a temporary commit in a throwaway clone): `git clone` the repo into the scratchpad, `nvm use`, `npm install && npm run dev`, wait for `:3000`, `:4000/api/health`, `:4100`. In the browser pane: pick each mattress, add to cart, header count updates, `/cart` shows lines and total, change quantity, remove, refresh and the cart persists. Check console and network for errors. Stop the servers and delete the clone.
- [x] **Submission checklist**: no `node_modules`, `.next`, `dist` or local settings tracked (`git ls-files`); `.interviewer/` stays ignored; no secrets; `git status` clean after the final commit.
- [x] Fill in the Verification log, set `Ready for review`.

## Acceptance criteria

- [x] A fresh clone runs with `npm install && npm run dev`, and the full shopper flow works.
- [x] `docs/architecture.md` and `docs/architecture.html` match the code; the error-body wording is consistent across docs.
- [x] `NOTES.md` covers how to run, decisions, cart storage (C3) with the real-data-store design, failure handling, known limitations and "with more time".
- [x] `README.md` changes by one pointer line only; `services/upstream/` is untouched.
- [x] Nothing local or generated is tracked (`.mcp.json` stays by choice).
- [x] Both builds pass.

## Verification log

2026-11-16, implementation session.

- **Architecture doc pass.** Drift fixed in `docs/architecture.md`: pages call `getProducts()` (wrapper over `apiGet`), not `apiGet` directly (diagram edges and Configurator section); the browser → rewrite edge is now dotted, since no client code fetches `/api/*` today; "Where things are" now lists `main.ts`, `app.module.ts`, `health.controller.ts`, `next.config.mjs`, and says which of service/mapper does what. Failure and configuration tables matched the code.
- **Error-body wording.** Code: no filter in `main.ts` or any module, so Nest's built-in handling. `architecture.md` and the Phase 5 file were right; the decision-log row in `docs/plan/README.md` now says "built-in exception handling, no custom filter".
- **`architecture.html`.** Same fixes: `getProducts()` in the web details and scenario notes; join/sell rules credited to `ProductsService`, mapper to pricing/sanitizing; `prune` returns units; browser details and the client-fetch scenario say no page fetches `/api/*` today. Opened in the browser pane, ran "Load page": renders, timeline updates, no console errors.
- **`NOTES.md`** written (run, R1–R7 table, decisions, C3 cart storage and real-store design, known limitations, with more time, how we worked). Each known limitation re-checked in the code and still open: `memoryRaw` (`CartProvider.tsx`), badge before prune (`HeaderCart.tsx`), no overall retry deadline and any 5xx retried (`upstream.client.ts`), no `app/global-error.tsx`, stepper commits each valid keystroke (`QuantityStepper.tsx#handleInput`). The other Phase 4 minors (`<aside>`, unencoded id, touch target, quantity ≤ 0) are fixed and not listed.
- **`README.md`**: one pointer line under the title, nothing else. **`CLAUDE.md`**: `NOTES.md` named next to the architecture docs.
- **Builds**: `npm run build -w apps/api` and `npm run build -w apps/web` pass (Node 26.13.1).
- **Clean checkout check**: `git clone` of the repo into the scratchpad, with this phase's uncommitted changes applied on top (`git diff HEAD | git apply` + `NOTES.md`), `nvm use`, `npm install`, `npm run dev`. Port 4000 was held by another BFF from the main checkout (not started by this session, left running), so the clone ran with `API_PORT=4010 API_URL=http://localhost:4010`; otherwise as documented. Web `:3000`, api `:4010/api/health`, upstream `:4100` all answered; `/api/products` through the rewrite returned the merged list. Browser pane: selected each mattress (URL follows `?product=`), added Zenhaven ×3, Loom & Leaf, Saatva Classic → badge "Cart, 5 items"; `/cart` showed three lines, sale price with struck list price, subtotal $6,995 (correct); + on Loom & Leaf, − on Zenhaven, Remove Saatva Classic → "Removed Saatva Classic. Cart total $5,596", focus on the next Remove; refresh kept 2 × Zenhaven + 2 × Loom & Leaf, $5,596, badge 4. No console errors. Servers stopped, clone deleted.
- **Submission checklist**: `git ls-files` has no `node_modules`, `.next`, `dist`, `.env*` or local settings; `.interviewer/` is ignored (`.gitignore:14`); no secrets found (`.mcp.json` only runs the public context7 server); `services/upstream/` unchanged. `git status` will be clean once the developer commits this phase.

## Review

### Scope changes during implementation

- None. Doc-only phase; no code changed.
- Clean checkout check ran before the commit on a clone with the working-tree changes applied (the plan allowed a temporary commit or after the developer commits; this avoids a throwaway commit), and on BFF port 4010 because 4000 was busy.

_Developer review notes go below._
