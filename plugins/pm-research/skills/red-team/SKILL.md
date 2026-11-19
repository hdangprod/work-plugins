---
name: red-team
description: Use when the user asks what is wrong with a memo, plan, argument or decision, or asks to challenge, stress-test, poke holes in, sanity-check or get a second opinion before committing, including when the text is pasted into the message and the answer is wanted in the reply. Do not critique someone's reasoning without this skill. Also use it on any pm-research report, options paper or plan before a one-way-door decision. It finds the beliefs the conclusion rests on, redoes the numbers, asks who the evidence came from, looks for the missing option and the unstated motive, ranks the problems, and says what would make the conclusion sound.
---

# Red team

The author of an analysis is the person least able to see what is wrong with it. This skill supplies a reader who has seen only the result, not the reasoning.

## Before you start
1. `pmr recall --skill red-team --topic "<topic>"`.
2. Size the work. The owner pasted their own memo or plan: you are the cold reader; go to the next section and answer in the reply. An artefact of a run (the report, `options.md` or `plan.md`; `pmr run status <topic>` lists them): go to "Reviewing a run's artefact".

## Challenging the owner's own reasoning
1. **What would have to be true** for the conclusion to hold? List those beliefs. The weakest of them is the riskiest assumption.
2. **Redo every number** from the figures given. State the correct figure, and the reading under which the author's claim could still be true.
3. **Ask who the evidence came from.** The people who answer a question are not the people it is about: those who built something and liked it reply; those who gave up do not.
4. **Look for the missing option**, including doing nothing, fixing the current setup and the smallest version. Read the listed options closely enough to say what really separates them.
5. **Name the trap and the motive**: sunk cost, a solution chosen before the problem, "no risks", a zero cost that leaves out time. Work already done is evidence about feasibility and effort, not a reason to continue; say what it has shown.
6. **Check the cost and the success test.** Time is a cost. A success test is decidable in advance and built from the owner's own baseline numbers.
7. **Rank.** The verdict and the one or two problems that would change the decision come first. Minor problems get a line each, or are left out.
8. **Close with what would make it sound**: the two questions whose answers would flip your verdict, and the cheapest way to answer each.

The reasoning checks, with examples: `references/reasoning-errors.md`.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Reviewing a run's artefact
Run `pmr lint <topic> --strict` first and fix mechanical errors; a reviewer's attention should not go to missing headings.
1. **Brief the `critic` agent with the artefact only.** Give it the path of the document, the output of `pmr claim list <topic> --pairs` (so it can open the evidence behind each claim) and the decision the document serves. Do **not** give it your reasoning, the conversation, which option you favour or what you are unsure about. An explanation from the author turns a review into agreement.
2. **Ask for a verdict on the decision, not on the prose.** The agent's instructions cover the method: restate the ask, find the claims the conclusion rests on, re-open their sources, look for what is missing, run the reasoning checks, write a pre-mortem.
3. **Save the review** as `red-team.md` in the run's work directory, using `templates/red-team.md` from this skill's folder. Record the findings as returned; do not soften them.
4. **Answer every finding** in the Response column with one of:
   - *fixed*: say what changed and where;
   - *accepted, not fixed*: it becomes a stated limitation or open question in the artefact;
   - *disputed*: give the evidence (claim ids). If you cannot, it is not disputed, it is accepted.
5. **Apply the consequences in the ledger.** A source that does not say what the claim says: `pmr claim verify <topic> <C-id> --source <E-id> --verdict refuted|partial --by critic`. A new fact found by the reviewer: add evidence and a claim, then verify it like any other.
6. **Revise the artefact**, then `pmr lint <topic> --strict` again. If a blocker changes the recommendation, say so at the top of your reply to the user.
7. **Log what the review caught**: each valid blocker or major finding is a mistake by the author: `pmr mistake add --skill <skill that produced it> --topic <topic> --source red-team --what "…" --why "…"`. This is how the plugin learns what to check earlier next time.
8. **Tell the user** the verdict, the blockers and what you did about each, and anything still open.

**Without subagents:** review it yourself in a fresh pass, writing findings before re-reading your own notes: (1) read only the recommendation and write down what would have to be true for it to hold; (2) for each of those, find the claim and re-open its source page; (3) go through the checks in the reference one at a time; (4) write the pre-mortem. Mark the review `by: self-review` in `red-team.md` and tell the user it was not independent.

## Quality bar
- The review names specific claims and locations, not general unease.
- For a run: at least the three claims that carry the recommendation had their sources re-opened, every finding has a response, and "disputed" comes with evidence.
- The artefact changed, or the review explains why nothing needed to.
- For a one-way door: no open blocker when the document is presented.

## Never
- Never give the reviewer the author's reasoning or preferred answer.
- Never delete or reword a finding you disagree with. Answer it.
- Never present a recommendation as reviewed when the review was your own second pass; say which it was.
