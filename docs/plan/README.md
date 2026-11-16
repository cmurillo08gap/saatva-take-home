# Build plan

The phased plan for building the specs in [`../take-home-specs.md`](../take-home-specs.md). Each phase has its own file, created from [`_template.md`](_template.md).

## Status

| Done | Phase | Specs | Status | Reviewed |
| --- | --- | --- | --- | --- |
| [ ] | [1. Products BFF](phase-1-products-bff.md) | R1 · C1 C2 C4 | Not started | — |
| [ ] | [2. Configurator UI](phase-2-configurator-ui.md) | R2 · C1 C2 | Not started | — |
| [ ] | [3. Cart core](phase-3-cart-core.md) | R3 R7 · C3 | Not started | — |
| [ ] | [4. Cart view](phase-4-cart-view.md) | R4 R5 R6 · C3 | Not started | — |
| [ ] | [5. Hardening](phase-5-hardening.md) | R1–R7 (quality) | Not started | — |
| [ ] | [6. Docs and submission](phase-6-docs-submission.md) | C3 discussion, submission | Not started | — |
| [ ] | [7. Extras (optional)](phase-7-extras.md) | O1 | Not started | — |

`[x]` in **Done** means the phase is `Accepted`. GitHub doesn't render checkboxes inside tables, so these are edited by hand. **Reviewed** holds the acceptance date.

## Status lifecycle

```
Not started → Planned → In progress → Ready for review → Accepted
                             ↑                │
                             └─ Changes requested
```

| Status | Meaning | Set by |
| --- | --- | --- |
| Not started | Phase file has goal, scope and open decisions only | — |
| Planned | Tasks and acceptance criteria approved in a plan-mode session | Claude, after the developer approves the plan |
| In progress | Implementation session underway | Claude |
| Ready for review | Built, verified, Verification log filled in | Claude |
| Changes requested | Review found issues, listed in the phase's Review section | Developer |
| Accepted | Developer approved the phase | Developer, or Claude only after explicit approval in chat |

## How we work

Each phase gets two sessions:

1. **Planning session (plan mode).** We refine the phase file: settle open decisions, write the task list and acceptance criteria. When the plan is approved, the status becomes `Planned`.
2. **Implementation session (a new session, accept-edits mode).** It starts from the phase file. Claude builds the phase, verifies it (builds pass, browser checks per `CLAUDE.md`), fills in the Verification log, and sets `Ready for review`.
3. **Review.** The developer reviews and leaves notes in the phase's Review section, then sets `Accepted` or `Changes requested`. On acceptance, the phase lands as one commit (e.g. `phase 1: merged products BFF route`), so the git history reads like the plan.

The next phase starts only after the current one is accepted.

## Guardrails

Rules for Claude in every session:

- **Never set `Accepted` or tick Done without the developer's explicit approval in chat for that phase.** Ask first every time. An earlier approval doesn't carry over to another phase or a later change.
- **Don't implement a phase unless its status is `Planned`.** If asked to implement a phase that isn't, stop and suggest planning it in plan mode first.
- **Don't implement in the session that planned the phase.** Suggest a new session in accept-edits mode instead.
- **No silent scope changes.** Anything added, dropped or changed during implementation goes back into the phase file and is flagged in its Review section.

## Decision log

| Date | Decision | Phase |
| --- | --- | --- |
| 2026-11-16 | Plan structure: index plus one file per phase, two sessions per phase (plan, then implement) | — |

## Spec coverage

| Spec | Phase(s) |
| --- | --- |
| C1 Web gets its data through the BFF | 1, 2, 3 |
| C2 Web doesn't know the upstream source | 1, 2 |
| C3 No database (cart storage choice) | 3, 6 |
| C4 Don't change `services/upstream` | 1 (applies throughout) |
| R1 Choose between the mattresses | 1, 2 |
| R2 Configurator UI matches the mock | 2 |
| R3 Add to cart, header count updates | 3 |
| R4 View the cart | 4 |
| R5 Change quantities and remove items | 4 |
| R6 Accurate cart total | 4 |
| R7 Cart survives a page refresh | 3 |
| O1 Anything else a real storefront needs | 7 |
