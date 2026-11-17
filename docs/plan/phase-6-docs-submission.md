# Phase 6: Docs and submission

**Status:** Not started · **Specs:** C3 discussion, submission requirements · **Depends on:** Phase 5 (and Phase 7 if it runs)

## Goal

The repo is ready to send: it runs from a clean checkout, and the docs explain what we built, why, and what we'd change with more time.

## Scope

- Final pass on `docs/architecture.md` (the living doc that extends the frozen `docs/base-architecture.md`, updated in each phase), with an updated diagram.
- Trade-offs and decisions, pulled from the decision log.
- "With more time / a real data store" notes for the pairing session (C3).
- "With more time" note (from Phase 2): the BFF could send the description as structured content (paragraphs, list items) instead of HTML, so no raw HTML reaches web and the contract doesn't carry the content provider's format.
- "With more time" note (from Phase 5): a Content Security Policy as defense in depth for the description HTML.
- Note (from Phase 5): the three product images were cropped to one size (1268×698) so they frame the same.
- Update `CLAUDE.md` and README pointers where needed.
- Clean checkout check: fresh clone, `npm install && npm run dev`, full flow works.
- Submission format (public repo or zip with `.git`, without `node_modules`).

### Out of scope

- Code changes beyond small fixes found during the clean checkout check.

## Decisions

| Decision | Options | Choice and rationale |
| --- | --- | --- |
| Ship `docs/plan/` with the submission | Keep / remove | _Open_. Keeping it shows how we worked |
| Submission format | Public GitHub repo / zip | _Open_ |

## Tasks

_Written in the planning session._

## Acceptance criteria

- [ ] A fresh clone runs with `npm install && npm run dev`, and the full shopper flow works.
- [ ] The architecture doc matches the code.
- [ ] Trade-offs and "with more time" notes cover cart storage, failure handling and anything we skipped.
- [ ] Both builds pass.

## Verification log

_Empty._

## Review

_Empty._
