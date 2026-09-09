# Resume Prompt — Expense Manager Parity Enhancement Program

Paste the block below at the start of any work session on this program. It is
self-orienting: it reads the checklist, figures out which phase is current, and
picks up from there — no matter which step you're on.

---

```
I'm working through the "Expense Manager parity" enhancement program on branch
`enhancement/expense-manager-parity`. All planning docs live in
`docs/superpowers/plans/` and `docs/superpowers/specs/`, and progress is tracked
in `docs/superpowers/plans/CHECKLIST.md`.

Before doing anything else:

1. Read `docs/superpowers/plans/CHECKLIST.md` in full. It is the source of truth
   for what is done and what is next. Find the first phase whose sub-tasks are
   not all ticked — that is the current phase.

2. Confirm the branch: `git branch --show-current` must be
   `enhancement/expense-manager-parity` (or a worktree off it). If a phase was
   merged, `git log --oneline -15` will show it.

3. Read the spec AND the plan for the current phase (both paths are in the
   checklist row). Phases run in this fixed order — never start one before its
   predecessor is merged:
     F1 Payment Mode:      1A api -> 1B web -> 1C mobile
     F2 Activity Heatmap:  2A api -> 2B web -> 2C mobile
     F3 Privacy Mode:      3A api -> 3B web -> 3C mobile
     F4 Accounts+Transfers:4A api -> 4B web -> 4C mobile

4. RECONCILIATION CHECK (critical for F2/F3/F4): the plans quote line numbers as
   of 2026-09-10. If any earlier phase has merged since — especially F1 or F4's
   schema changes — the line numbers and surrounding code in the current plan may
   be stale. Before executing, open each file the current plan touches and
   reconcile: verify the anchors still exist, adjust line refs, and confirm the
   described code still matches. Note any drift you had to correct.

5. Execute the current phase task-by-task using
   `superpowers:subagent-driven-development` — one fresh subagent per task,
   two-stage review between tasks, per-task commits with the messages the plan
   specifies. Do NOT batch tasks or skip the failing-test step.

6. Verification gate before marking a phase done:
   - API phases (xA): `cd server && npm test` (node:test) all green, plus run the
     phase's `server/scripts/smoke-*.mjs` against a scratch DB.
   - Web phases (xB): `cd client && npx vite build` succeeds, run the plan's grep
     gates, and walk the plan's manual checklist. There is no eslint config —
     `vite build` is the real check, don't add a lint step.
   - Mobile phases (xC): `cd mobile-app && npx expo start -c` and smoke the
     changed screens on a device/emulator per the plan's checklist.

7. When the phase passes its gate: merge to the branch (or main, per how prior
   phases were handled — check `git log`), then tick every sub-task for that
   phase in CHECKLIST.md and commit the checklist update.

Constraints that apply to every phase:
- Ponytail mode: climb the ladder, reuse existing patterns, add ZERO new
  dependencies. `server/` tests use the built-in `node:test` + `node:assert`.
- The Expense Manager Android app is a FEATURE-IDEA reference only. Do not copy
  its UI, code, or copy.
- Follow the plan's literal test code and implementation code. If the plan is
  wrong or the code has drifted, stop and tell me what you found before
  improvising — don't silently deviate.
- Commit messages end with:
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>

Tell me which phase you're starting, what reconciliation drift you found (if
any), then begin Task 1.
```

---

## Quick reference

| Feature | Order | Spec | Plans |
|---|---|---|---|
| F1 Payment Mode | 1A → 1B → 1C | `specs/2026-09-10-payment-mode-design.md` | `plans/2026-09-10-payment-mode-{1a-api,1b-web,1c-mobile}.md` |
| F2 Activity Heatmap | 2A → 2B → 2C | `specs/2026-09-10-activity-heatmap-design.md` | `plans/2026-09-10-activity-heatmap-{2a-api,2b-web,2c-mobile}.md` |
| F3 Privacy Mode | 3A → 3B → 3C | `specs/2026-09-10-privacy-mode-design.md` | `plans/2026-09-10-privacy-mode-{3a-api,3b-web,3c-mobile}.md` |
| F4 Accounts + Transfers | 4A → 4B → 4C | `specs/2026-09-10-accounts-transfers-design.md` | `plans/2026-09-10-accounts-transfers-{4a-api,4b-web,4c-mobile}.md` |

Program roadmap: `specs/2026-09-09-expense-manager-parity-roadmap.md`
Progress tracker: `plans/CHECKLIST.md` (the one file that always tells you where you are)
