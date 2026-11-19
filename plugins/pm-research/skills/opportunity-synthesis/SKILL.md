---
name: opportunity-synthesis
description: Turns research findings into a ranked set of opportunities. Use after teardowns, a market map or voice-of-customer work, or when the user asks "so what should we do with all this", "where are the gaps", "which competitor weaknesses can we fix", or "what did we learn". Builds an opportunity tree from the desired outcome down to unmet needs, and a table of competitor weaknesses we could address, each tied to evidence.
---

# Opportunity synthesis

Research produces findings. A decision needs opportunities: unmet needs, pains and desires of real users, stated without a solution attached. This skill does the conversion and stops before choosing what to build.

## Before you start
1. `pmr recall --skill opportunity-synthesis --topic "<topic>"`.
2. `pmr run status <topic>` and `pmr claim list <topic>`. Work only from verified claims; go back to `deep-research` step 3 if many are unverified.
3. Read every working file of the run (teardowns, market map, voice of customer). Copy `templates/opportunities.md` from this skill's folder to `opportunities.md` in the run's work directory.

## Steps
1. **State the outcome.** One measurable change in user behaviour or in the product's results that the decision in the brief is meant to produce. If the brief has none, propose one and mark it as a proposal. A feature is not an outcome.
2. **Extract candidate opportunities** from the findings, one line each, in the user's words: "I can't …", "I have to … every time", "I wish …", "I don't trust …". Sources: weaknesses in the teardowns, pain and workaround themes, white space in the map, anxieties in switching stories. Each cites claim ids.
3. **Strip the solutions out.** Rewrite "needs a mobile app" as the need behind it ("I want to capture a thought when I'm away from my desk"). Test: could three quite different solutions address it? If only one could, it is still a solution.
4. **Build the tree.** Outcome at the root; opportunities below it; break a broad opportunity into narrower children until each leaf is small enough to address with one focused effort. Siblings must be distinct. Merge duplicates; an opportunity that serves a different outcome goes to a "parked" list, not into the tree.
5. **Assess each leaf**, in words backed by evidence rather than invented scores:
   - *reach*: which segment has it, and how common is it in the evidence (count and source mix);
   - *intensity*: does it block the job, slow it, or annoy; do people build workarounds or pay to avoid it;
   - *how well it is served today*: by whom, how well, and whether the gap is structural (see the teardown's weakness kinds);
   - *fit*: does it suit what we are and can do (ask the user or read the project's own docs; do not guess their strengths);
   - *evidence strength*: confidence of the supporting claims.
6. **Build the weakness table.** For each competitor weakness that maps to an opportunity: which product, the weakness, its kind, who it hurts, whether we could plausibly do better and why, and what it would cost us in complexity. Leave out weaknesses that are in progress on their side.
7. **Name the top three to five opportunities** and say why these and why not the next ones. State what you are least sure about and what evidence would settle it.
8. **Record what was not found.** Needs you expected and found no evidence for go under open questions; they may be absent, or the sources may be blind to them.
9. `pmr lint <topic>`, then continue with `strategy-options`.

Method detail: `references/ost.md`.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Quality bar
- No leaf names a feature or technology.
- Every leaf cites at least one verified claim. Leaves resting only on inference or on a single community source are marked as such.
- The tree has one outcome. Two outcomes means two trees, or a decision the user must make first.
- The ranking explains itself in sentences. A weighted score with made-up weights is false precision.
- The top opportunities include at least one that no competitor's weakness suggested. Copying the market's gaps alone yields a product defined by others.

## Never
- Never slip a solution in as an opportunity because it seems obviously right.
- Never rank by how interesting an opportunity is to build.
- Never drop an opportunity silently because it is inconvenient. Park it with a reason.
