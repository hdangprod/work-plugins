---
name: competitor-teardown
description: Use when the user asks to research, analyse, review or tear down a specific product, app or competitor, asks what it does well and badly, or asks what to copy or avoid from it, including when the pages are supplied in the message. Do not analyse a product without this skill. It keeps apart what the vendor says, what the product does and what users experience, ties every finding to a quoted source, leaves unknowns unknown, covers the job, users, pricing, positioning, strengths, weaknesses and direction, and ends with what to copy, what to avoid and where the product is exposed.
---

# Competitor teardown

A teardown answers three questions: why do people choose this product, where does it let them down, and what does that mean for us. A feature list answers none of them.

## Before you start
1. `pmr recall --skill competitor-teardown --topic "<product and category>"`.
2. Size the work. Pages supplied in the message: keep the three voices apart, use the steps below for the thinking and answer in the reply. Otherwise `pmr run status <topic>`; no run: use `research-plan` (the decision is usually "what should we learn from, and do differently than, this product").
3. For a run, copy `templates/teardown.md` from this skill's folder to `teardown-<product>.md` in the run's work directory. One file per product.

## Three voices, kept apart
Collect each separately, because the gaps between them are the findings:

| Voice | It tells you | Where |
| --- | --- | --- |
| What the company **says** | positioning, intended customer, promised value | home page, pricing page, launch posts, ads |
| What the product **does** | real behaviour, limits, flows | docs, changelog, API reference, demo videos, the product itself if it can be tried |
| What users **experience** | value in practice, pain, workarounds | reviews, forums, issue trackers, "alternative to" threads |

A promise the docs do not support is a weakness. A capability users love and the home page never mentions is an under-used strength. A feature the vendor promotes and no user praises is not yet a strength. Something a user reports the vendor "is working on" is second-hand; mark it so.

## Steps
1. **Collect** with `deep-research` steps 1–3 (scouts → evidence ledger → claims → verification). Brief one scout per voice, plus one for pricing and limits and one for direction (12 months of changelog, job posts, founder statements). At `quick` depth, read the pricing page, the docs overview, the changelog and one page of low-rated reviews yourself.
2. **Job.** State the job users hire it for, in their words: "When I …, I want to …, so that …". Name the main job and up to two secondary ones. Evidence comes from user voice, not from the tagline.
3. **Who and when.** The segment it serves best, the situation that triggers adoption, and who it serves badly.
4. **Alternatives.** What those users would use if this product did not exist, including the manual way.
5. **How it works.** The core loop a user repeats, the first-run experience up to first value, and the two or three design decisions that define the product. Note what it deliberately does not do.
6. **Money.** Plans, prices, the unit charged for, what the free tier withholds, and where the upgrade pressure sits. Record the date; this goes stale first.
7. **Positioning** in Dunford's order: competitive alternatives → unique attributes → the value those enable → who cares most → the market category it claims.
8. **Strengths.** What it does better than the alternatives and *why that is hard to copy* (data, distribution, integration depth, habit, cost structure). A strength that is easy to copy is a feature, not a moat.
9. **Weaknesses.** Sort each one:
   - *structural*: follows from its business model, architecture or main customer; unlikely to be fixed. These are openings.
   - *neglected*: fixable, but ignored for a long time. An opening while it lasts.
   - *in progress*: the changelog shows they are on it. Not an opening.
10. **Direction.** Where the last 12 months of shipping point, and what that would close or open for us.
11. **So what.** Three short lists: **copy** (works for users and fits us), **avoid** (their mistakes and their compromises), **exploit** (structural weaknesses we can serve). Each item names the claim or page it rests on. Translate each lesson to what the owner's own thing is; a personal tool that is not for sale gets no commercial advice.
12. For a run: `pmr lint <topic>`. For a single-product run, the teardown becomes the report: follow `deep-research` step 5, using the report template with the teardown's sections as findings.

Method detail, the question bank and where to look: `references/teardown-method.md`.

## Answering in the reply
What to copy, what to avoid and where the product is exposed come first. Each item is an instruction for the owner's own product ("show the source passage under every answer"), followed in brackets by the page it rests on: (home page), (pricing page), (forum thread, 2 of 6 people).

Then one table of the strengths and weaknesses behind those items, a row each: `Finding | Voice | Page and the words quoted | People`, where the voice is vendor says, product shows or users report. This table is the evidence, so it is not optional. Count people instead of naming them. State nothing about the product that the supplied pages do not contain; a reading of your own (why a limit exists, where the upgrade pressure sits) is marked as an inference where it appears. Do not reprint pricing or feature pages the owner supplied. End with the one test worth running next.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Quality bar
- Every strength and weakness has its evidence (a claim id in a run); user-voice items say how many people, how many independent sources and which kind.
- Strengths outnumber weaknesses or match them. A teardown that finds only faults has not understood why people pay.
- "They have feature X" never appears without "which lets users …".
- Prices and limits are quoted from the vendor's own page with the date.
- At least one finding surprised you or contradicted a hypothesis in the brief. If nothing did, look harder at user voice.

## Never
- Never describe behaviour you only read about in marketing copy as if you had observed it.
- Never generalise from a handful of reviews to "users".
- Never sign up, log in, or accept terms on the user's behalf to try a product. Ask the user to do it, or work from public material.
