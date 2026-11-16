# Phase 6: Docs and submission

**Status:** Not started · **Specs:** C3 discussion, submission requirements · **Depends on:** Phase 5 (and Phase 7 if it runs)

## Goal

The repo is ready to send: it runs from a clean checkout, and the docs explain what we built, why, and what we'd change with more time.

## Scope

- New architecture doc for the final state (the follow-up that `docs/base-architecture.md` mentions), with an updated diagram.
- Trade-offs and decisions, pulled from the decision log.
- "With more time / a real data store" notes for the pairing session (C3).
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
