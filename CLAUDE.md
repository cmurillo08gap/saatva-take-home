# CLAUDE.md

Saatva storefront exercise: a Next.js frontend, a NestJS BFF, and mock third-party upstream services. See `README.md` for the brief and `docs/base-architecture.md` (+ `docs/base-architecture.html`) for the initial architecture, before implementation (frozen), `docs/architecture.md` for the current one, and `NOTES.md` for the submission write-up (decisions, cart storage, limitations, with more time).

## Commands

Node 26+ (`.nvmrc`), npm workspaces monorepo; run from the repo root.

```bash
nvm install && npm install
npm run dev            # upstream :4100 + api :4000 + web :3000
npm run dev:upstream   # or dev:api / dev:web individually
npm run build -w apps/api
npm run build -w apps/web
```

No test runner or linter is configured. Formatting follows `.prettierrc` (no semicolons, single quotes, trailing commas, 100 cols).

## Layout

| Path | What | Editable? |
| --- | --- | --- |
| `services/upstream/` | Mock catalog + content services | No, simulates third parties |
| `apps/api/` | NestJS BFF, prefix `/api`, port 4000 | Yes |
| `apps/web/` | Next.js App Router, port 3000 | Yes |
| `docs/mock.png` | Design guide for the configurator | — |

## Architecture in brief

- The browser only talks to `web`. Client-side `/api/*` calls are proxied to the BFF by `rewrites()` in `apps/web/next.config.mjs`; server-side code calls the BFF directly via `apps/web/lib/api.ts#apiGet` (`API_URL`).
- The BFF reaches upstream through `UpstreamClient` (`apps/api/src/upstream/`, `UPSTREAM_URL`).
- Constraint from the README: the web app must not know which upstream anything came from. There is no database.

## Conventions

- BFF: one Nest module per feature; controller → service → `UpstreamClient`.
- Web: `@/*` maps to `apps/web/`; interactive components need `'use client'`; plain CSS with tokens in `app/globals.css`.
- Dependency versions are pinned exactly; keep it that way.
- Work must run from a clean checkout with `npm install && npm run dev`.

## Plan workflow

Work follows the phases in `docs/plan/README.md` (status table, lifecycle, guardrails). Each phase is planned in plan mode, then implemented in a new session in accept-edits mode.

- Never mark a phase `Accepted` or tick Done without the developer's explicit approval in chat for that phase; ask every time.
- Only implement a phase whose status is `Planned`; otherwise suggest planning it in plan mode first.
- Don't implement in the session that planned the phase; suggest a new accept-edits session.
- Stop at `Ready for review` after filling in the phase's Verification log. Record scope changes in the phase file.

## Testing in the browser

Implementation is done in the Claude Code desktop app, so verify UI changes in its built-in browser pane (the `mcp__Claude_Browser__*` tools).

- Start the app with `npm run dev` (run it in the background so it keeps running) and wait until web `:3000`, api `:4000/api/health` and upstream `:4100` respond.
- Open `http://localhost:3000` in the browser pane. Prefer `read_page` / `get_page_text` over screenshots to check content; use screenshots for layout, and `resize_window` (mobile / tablet / desktop) for responsive checks. Reset the viewport to desktop afterwards.
- Exercise the real flows: pick a mattress, add to cart, change quantity, remove, refresh and confirm the cart persists. Check the console and network panels for errors (`read_console_messages`, `read_network_requests`).
- To test failure handling, restart upstream with `UPSTREAM_FAIL_SERVICE=catalog|content` or `UPSTREAM_FAILURE_RATE`, then restore the defaults.
- Stop dev servers you started when done.
