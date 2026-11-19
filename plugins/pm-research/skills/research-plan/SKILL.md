---
name: research-plan
description: Turns a research request into a decision-first brief before anything is searched. Use at the start of any product, competitor or market research, or when a request is vague ("look into X", "research this app"). It names the decision, the questions that could change it, hypotheses with probabilities, the source plan, the depth and the stop rule.
---

# Research plan

A brief takes ten minutes and saves hours of collecting facts that change nothing. No searching happens before the brief exists.

## Steps
1. **Recall.** `pmr recall --skill research-plan --topic "<request>"`. Read any earlier note it lists; the question may be half answered already. A note past its refresh date is a starting point, not an answer.
2. **Name the decision.** Write it as "Decide whether to … / which … / how much …". Name who decides and by when. Write the default: what we would do today with no research.
   - If no finding could move us off the default, say so and stop. That is a successful outcome.
   - If the request names only a subject ("research Notion"), propose the most likely decision behind it and state your assumption instead of opening with a round of questions.
3. **Size the door.** A one-way door is costly or slow to reverse: architecture, pricing model, public commitment, months of build. A two-way door can be undone in days. One-way gets `deep`; two-way gets `quick` or `standard`.
4. **Start the run.**
   ```bash
   pmr run start <topic-slug> --decision "Decide whether to …" --door one-way|two-way [--depth quick|standard|deep]
   ```
   It creates `brief.md` from the template and prints recalled lessons. Topic slugs are short kebab-case (`chat-ui`, `notes-app-pricing`).
5. **Write 3–7 questions.** Each must be able to change the decision; write how next to it. Order them by how much they could move it. Typical families:
   - Problem: who has it, how often, what do they do today, what does it cost them?
   - Alternatives: what do people use now, including manual work and nothing? Would fixing the current setup be enough?
   - Products: what do the leading ones do well, do badly, charge, and where are they heading?
   - Users: what do they praise, complain about, and switch for?
   - Us: what could we do that others cannot or will not?
   - Risk: what would make this fail?
6. **Write hypotheses before searching.** For each main question, what you expect to find and a probability. They expose your priors, so the research can surprise you, and they are scored in the after-action.
7. **Plan sources per question.** Which tier can answer it best, named starting points, and what must be read first-hand. See `references/decision-first.md` for which source answers which kind of question.
8. **Set the stop rule.** A budget (pages, scouts) plus a saturation test, for example "stop when two scouts in a row add no new claim". Research ends when the decision can be made, not when the internet runs out.
9. **Write Out of scope.** What this run will not answer.
10. **Check and show.** `pmr lint <topic>` must be clean. Show the user the decision, the questions and the depth in a few lines, and end with the two or three things only they can answer. For a `deep` run, wait for their confirmation before spending the budget; for `quick` and `standard`, proceed and let them redirect.

When the owner asks for the brief in the reply and no run is wanted, write the same brief there: steps 2, 3 and 5–9, no run and no file.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Quality bar
- The decision is one sentence and names an action.
- Every question has a "this would change the decision by …" clause.
- At least one question looks for reasons **not** to do the thing the user seems to want.
- At least one hypothesis is below 60%: if you are sure of everything, you do not need research.
- The brief fits on one screen.

## Next
`pmr run status <topic>` names the next step. Usually that is a lens skill (`competitor-teardown`, `market-map`, `voice-of-customer`) or `deep-research` directly.
