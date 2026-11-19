---
name: research-retro
description: Closes a research run and makes the plugin better over time. Use when a research task is finished, when the user says "retro", "what did we learn", "close this research" or corrects the same kind of mistake again, and periodically to review lessons, prediction accuracy and pending improvement proposals. Writes the after-action, turns mistakes into lessons, resolves predictions, and drafts proposals to change the plugin's own skills, which only the user can approve.
---

# Research retro

Learning happens here or not at all. A run that ends without a retro repeats its mistakes in the next one.

**The rule that makes this safe:** the plugin records mistakes and lessons by itself, and it may *draft* changes to its own skills, checks and evals. It applies such a change only after the user approves that exact proposal by typing `approve P-###`. The approval is read from the user's own message by a hook; no command of yours can grant it.

## A. Close a run
1. `pmr recall --skill research-retro --topic "<topic>"`, then `pmr run status <topic>`. Follow its `next:` line until it asks for the after-action.
2. `pmr run retro <topic>` writes `after-action.md` with the measured part filled in: evidence by tier, claim statuses, share of claims that failed verification, mistakes logged, predictions.
3. **Collect the mistakes of this run.** Go through: corrections the user made (check the conversation), claims the verifier refuted or marked partial, valid red-team findings, evidence never cited (wasted search), and hypotheses from the brief that turned out wrong. Log any not yet logged: `pmr mistake add --what "…" --why "…" --skill <skill> --topic <topic> --source owner|verifier|red-team|self`.
4. **Distil each mistake**, looking for the cause in the method rather than in the instance:
   - an existing lesson covers it → `pmr lesson hit <L-id> --from <M-id>`;
   - otherwise → `pmr lesson add --trigger "<situation>" --rule "<what to do>" --skill <skill> --from <M-id>`.
   Lessons are general and portable: no product names, no project details. Format and tests: `references/learning-loop.md`.
5. **Note how the owner worked in this run.** What they asked to be changed about the form or the way of working (shorter, a different order, more or fewer questions, a different kind of evidence), not about the content. A general preference they stated: `pmr profile add --source owner …`. One you only noticed: `--source self`. One that holds for this project only: propose it for the project's context file.
6. **Fill in the judgement sections**: what went well (habits worth keeping, tied to a number or a moment), what went wrong, lessons (ids), predictions (ids and why each probability), proposals (ids or "no proposal").
7. `pmr run close <topic>`. It refuses while something is missing and says what.

## B. Periodic review (monthly, or when the user asks how the plugin is doing)
1. `pmr retro` for the overview and `pmr audit` for what needs attention.
2. **Resolve predictions that are due**: `pmr predict list --due`, check what actually happened (ask the user when only they can know), then `pmr predict resolve <PR-id> --outcome true|false|void`. Read `pmr predict report`: if stated confidence runs above the actual rate, record a lesson about it.
3. **Prune.** Lessons never recalled, candidates never confirmed, and near-duplicates: correct with `pmr lesson set`, merge, or `pmr lesson retire <L-id> --reason "…"`.
4. **Settle the working-style guesses.** `pmr profile list --status observed`: put each rule to the owner in one line and ask keep, reword or drop; then `pmr profile confirm`, `pmr profile set` or `pmr forget`. Ask whether any confirmed rule has stopped being true.
5. **Check applied proposals that reached their date**: did the expected effect happen? If not: revert the change on a branch, `pmr proposal rollback <P-id> --note "…"`.
6. **Promote recurring lessons** (section C).
7. Report to the user in a few lines: trend in verification failures, calibration, what was pruned, what is waiting for them.

## C. Propose a change to the plugin
For each lesson listed under "Promotion candidates" (recurred at least twice, enforced by nothing):
1. **Choose the strongest mechanism that fits**: a `pmr lint` rule or CLI check (cannot be skipped) > a hook > an eval case (detects regressions) > a step in a `SKILL.md` > a note in a reference. Prose is the last resort; a lesson that prose already failed to enforce needs more than more prose.
2. **Write the proposal body** from `templates/proposal.md` in this skill's folder: the evidence (lesson and mistake ids, what it cost), the exact change as a fenced `diff` block against the plugin's files, the expected measurable effect, how it will be checked, and how to undo it. Keep one concern per proposal and the diff small.
3. `pmr proposal add --title "…" --lessons L-### --targets <plugin-relative paths> --expect "…" --check-by YYYY-MM-DD <body file>`.
4. **Stop and tell the user**: the proposal id, a two-line summary, and that typing `approve P-###` or `reject P-###` decides it. Do not apply anything.

## D. Apply an approved proposal
Only when `pmr proposal list` shows it as `approved`:
1. In the plugin repository, create a branch `proposal/P-###`.
2. Change only the proposal's targets and `CHANGELOG.md` (the guard blocks other plugin files). Apply the diff as approved; if it no longer applies cleanly or you want to change it, write a new proposal.
3. Run the plugin's tests (`npm test` in the plugin folder) and, where an eval covers the changed skill, the eval.
4. Add a `CHANGELOG.md` entry: proposal id, lessons, what changed, expected effect, re-check date.
5. `pmr lesson set <L-id> --enforced-by <path>` for each lesson now enforced, then `pmr proposal applied <P-id> --note "<branch or commit>, tests <result>"`.
6. Tell the user what changed and that the branch is theirs to review and merge. Commit or merge only if they ask.

## Never
- Never edit plugin files without an approved proposal, and never widen an approved change.
- Never approve, or try to approve, a proposal yourself.
- Never close a run by writing "none" under lessons when mistakes were logged.
- Never put project names, private details or source quotes into lessons or proposals; shared memory travels across projects.
- Never keep a change that did not have its expected effect just because it is already applied.
