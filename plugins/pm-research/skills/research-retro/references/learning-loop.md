# The learning loop

```
 mistake ──► lesson (candidate) ──► lesson (active) ──► proposal P-### ──► applied change ──► checked on its date
 M-###        recalled at skill        recurs ×2,          owner types         branch, tests,      effect seen: keep
              start                    nothing enforces    approve P-###       CHANGELOG           no effect: roll back
                    │                                                                                   
                    └──► never recalled or never confirmed ──► retired
```

Each stage has one job. Skipping a stage is how self-improving systems go wrong: lessons nobody reads, or changes nobody approved.

## 1. Mistake
A mistake is a specific thing that went wrong in a run, with who caught it.

| Source | Example |
| --- | --- |
| owner | the user corrected a conclusion, a method or a format |
| verifier | a claim was refuted or only partly supported by its source |
| red-team | a valid blocker or major finding |
| self | a wasted search path, a wrong hypothesis, a missed step noticed afterwards |

Write what happened and why, in one line each. "Cited a price from a third-party article; the vendor's page showed a different one" is a mistake. "Research could be better" is not.

## 2. Lesson
A lesson is a rule for next time: **trigger → rule**.

| Weak | Strong |
| --- | --- |
| Be more careful with pricing | quoting a price or limit → take it from the vendor's own page and record the date |
| Verify more | a claim rests on one community post → find a second independent source or mark it tentative |
| The owner prefers short reports | writing the recommendation → lead with the decision and the confidence, details after |

Tests for a good lesson:
1. **Trigger is recognisable** at the moment it matters ("quoting a price"), not a mood ("when being careless").
2. **Rule is an action** someone could be seen doing or not doing.
3. **General**: it would apply in another project. No product or project names.
4. **One line.** If it needs a paragraph, it belongs in a skill reference, through a proposal.
5. **Not already covered.** `pmr lesson add` refuses near-duplicates; use `pmr lesson hit` instead.

Look for the cause in the method. Five whys, stopped at the first thing the method could have prevented: why was the price wrong → it came from an article → why use the article → the scout was not told to prefer the vendor's page → lesson for the scout brief.

A new lesson starts as a `candidate`. It becomes `active` when it recurs (`pmr lesson hit`) or the owner confirms it. Lessons from the owner's corrections start active.

## 3. Recall
Every skill begins with `pmr recall --skill <name> --topic "…"`. It returns the few lessons that match the skill and the topic, earlier work on the topic, and unreliable domains. Recall counts usage; lessons never recalled show up in `pmr audit` for retirement.

The budget (60 lessons, 8 KB) is deliberate. A memory that only grows stops being read. When it is full, merge or retire before adding.

## 4. Proposal
A lesson that recurs with nothing enforcing it has shown that remembering is not enough. Promote it to a mechanism, strongest first:

| Mechanism | Strength | Use when |
| --- | --- | --- |
| `pmr lint` rule or CLI refusal | cannot be skipped | the mistake is visible in a file or a ledger |
| hook | automatic reminder or block | the mistake is tied to a moment (session start, a write, stopping) |
| eval case | catches regressions | the behaviour can be judged from an output |
| step in a `SKILL.md` | read every time the skill runs | a missing or misordered step |
| note in a reference | read on demand | background and examples |

A proposal contains the exact diff. The owner approves a concrete edit, never an intention. One concern per proposal; small diffs are approved faster and are easier to undo.

Each proposal states an **expected effect that can be observed** ("claims refuted for pricing drop to zero over the next three runs") and a **check date**.

## 5. Approval and application
- Only the owner approves, by typing `approve P-###` (or `duyệt P-###`) in the chat. A hook reads the owner's own message; the agent cannot produce that event.
- An approved proposal unlocks only its listed targets and the changelog, until it is marked applied.
- Changes are made on a branch of the plugin repository, tested, and described in `CHANGELOG.md` with the re-check date.

## 6. Check and roll back
On the check date `pmr audit` asks whether the expected effect happened. If it did, keep the change and set the lesson's `enforced by`. If not, revert it and record `pmr proposal rollback`. A change that does not earn its place is removed; skills that only ever grow become unreadable.

## 7. Calibration
Each recommendation records at least one prediction with a probability and a due date. When resolved, `pmr predict report` shows stated confidence against what happened, and the Brier score (lower is better; 0.25 is what always saying 50% would score).

- Stated above actual: overconfident. Lower the numbers, widen the ranges, and ask what evidence was over-weighted.
- Stated below actual: underconfident. Recommendations can be firmer.
- Too few resolved predictions: say so; do not read a pattern into five results.

## What the loop must never do
- Change the plugin without the owner's approval of the exact diff.
- Carry project-specific or private information into shared memory.
- Rewrite lessons wholesale. Edits are small and attributable: add, hit, set, retire, forget.
- Count activity as improvement. The measures are the verification failure rate per run, the calibration gap, and how often the owner has to correct the same thing twice.
