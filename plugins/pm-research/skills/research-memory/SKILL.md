---
name: research-memory
description: Controls what pm-research remembers. Use to recall what was learned before, to record a correction, mistake or lesson, to record or change how the owner likes to work, to fix or retire a lesson, to forget something, to see how reliable a source domain has been, or to audit memory for stale and unused entries. Covers the shared method memory, the owner's working-style profile and the per-project research records.
---

# Research memory

Memory has two tiers, and all of it is changed through `pmr`. Never open the files and edit them; a hook blocks that, and for a reason: ids, budgets and history only hold if every change goes through one door.

| Tier | Where | Holds | Travels across projects |
| --- | --- | --- | --- |
| Shared (method) | the shared memory directory (`pmr paths`) | the owner's working-style profile, lessons, mistakes, source track record, predictions, proposals | yes |
| Project (content) | the project's work and report directories, and its context file | hard limits and decisions of this project, briefs, evidence, claims, reports, options, plans, after-actions | no |

**The line between them:** shared memory is about *how to research* and *how this owner works*. Project memory is about *what was found* and *what holds here*. A lesson or profile rule never names the project's product, customers, numbers or plans. If the project lists `private_terms` in `.pm-research.json`, `pmr` refuses shared entries that contain them.

## How the owner works
```bash
pmr profile add --area <word> --rule "one sentence" [--source owner|self]
pmr profile list [--area a] [--status observed|confirmed]
pmr profile confirm W-###                 # only after the owner said yes to that rule
pmr profile set W-### --rule "…" [--area a]
pmr forget W-###
```
- `--source owner` is for what the owner said in their own words; it is `confirmed` at once. Anything you inferred is `--source self` and stays `observed`: recall prints it as a default, and the session brief keeps asking until the owner confirms or drops it.
- A rule is one line (160 characters), about how to work, true in every project. `--area` is one word for where it applies (`reporting`, `decisions`, `evidence`, `planning`, `collaboration`, or a new one when none fits).
- The budget is 24 rules. A style that needs more is two styles: merge, or move the project-specific part out.
- **What is true of one project only** goes in that project's context file (`context_file` in `.pm-research.json`, set with `pmr init --context <file>`; `pmr paths` shows it). The owner edits that file directly; recall prints its first 40 lines, and it overrides the shared rules where they disagree. This is how the same profile serves several projects.

## Recall
```bash
pmr recall --skill <skill> --topic "<words>" [--limit 5]
```
Prints the few lessons that match, earlier runs and notes in this project, and source domains that often failed verification. Every skill starts with it. Recalled lessons are instructions to yourself; recalled notes are leads that may be stale (check `refresh_after`).

## Record a mistake
The moment the user corrects you, a verifier refutes a claim you made, or the red team finds a real problem:
```bash
pmr mistake add --what "what went wrong, concretely" --why "what led to it" --skill <skill> --topic <topic> --source owner|verifier|red-team|self
```
The command prints what to do next: either "this looks like lesson L-###, record the recurrence" or a ready `pmr lesson add` line.

## Distil a lesson
```bash
pmr lesson add --trigger "the situation in which this applies" --rule "what to do, as an instruction" --skill <skill|any> --source owner|verifier|red-team|self --from M-###
pmr lesson hit L-### --from M-###        # the same lesson came up again
```
A good lesson is one line, about method, and testable:
- Trigger names a recognisable situation: "quoting a price", "summarising reviews", "the user asks to 'look into' a product".
- Rule is an action: "open the vendor's pricing page and copy the sentence", not "be careful with prices".
- It would have prevented the mistake, and it applies outside this project.

Lessons from the owner are `active` at once. Lessons you infer start as `candidate` and become `active` on the second occurrence. A lesson that recurs with nothing enforcing it becomes a promotion candidate: `research-retro` turns it into a proposal.

## Correct, retire, forget
```bash
pmr lesson list
pmr lesson set L-### --rule "better wording"          # also --trigger, --status, --enforced-by
pmr lesson retire L-### --reason "now enforced by lint"   # keeps history in the retired file
pmr forget L-###                                      # removes content; the id is never reused
pmr forget E-### --topic <topic>                      # evidence or claims of one run
```
- **Retire** when a lesson is superseded, enforced by a mechanism, or no longer true.
- **Forget** when something should not have been stored: private detail, a wrong entry, anything the user asks to remove. Do it at once and confirm what was removed.
- Evidence that a claim still cites cannot be forgotten; forget or replace the claim first.

## Audit
```bash
pmr audit      # stale notes, due predictions, recurring lessons with no enforcement, unused lessons, weak domains
pmr retro      # dashboard: lesson budget, mistakes by skill and source, calibration, proposals, failure rates
pmr sources    # per-domain verification record
pmr source note <domain> --note "why to trust or distrust it" [--tier third]
```
Run `pmr audit` when the session brief flags something, before a large run, and during `research-retro`. Present the items to the user with a suggested action for each; do not silently fix them.

## Budgets
- At most 60 lessons and 8 KB. When the budget is reached, `pmr lesson add` refuses: merge near-duplicates, retire what a mechanism now enforces, and retire what was never recalled.
- Recall returns only a handful of lessons per skill. A lesson that needs a paragraph is not a lesson; put the detail into a proposal to change a skill.
- Reports carry `verified` and `refresh_after`. Past that date a note is a lead, not a source.

## When the user asks
| They say | Do |
| --- | --- |
| "What did we learn about X?" | `pmr recall`, then read the listed reports; answer with their dates |
| "Remember that …" (about method) | `pmr lesson add --source owner` |
| "From now on …", "I prefer …", "always / never …" (about how they work) | `pmr profile add --source owner` |
| "Remember that …" (about the project) | propose the line for the project's context file, or its own notes; it does not go in shared memory |
| "That was wrong" | `pmr mistake add --source owner`, then the lesson step |
| "Forget …" | `pmr forget`, confirm the id |
| "Why did you do it that way?" | name the lesson id or principle that applied |

Details of file formats and limits: `references/memory-model.md`.
