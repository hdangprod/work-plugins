---
name: product-plan
description: Turns a chosen direction into a professional product plan. Use when the user has picked an option and asks for a plan, roadmap, PRD, one-pager, milestones or "how do we get there". Produces the outcome, non-goals, the riskiest assumption and its cheapest test, milestones that each deliver something usable and end in a decision, metrics, and kill criteria.
---

# Product plan

A plan is a sequence of bets ordered so that the cheapest, most informative ones come first. It says what will be learned at each step and what result would stop the work.

## Before you start
1. `pmr recall --skill product-plan --topic "<topic>"`.
2. Confirm the direction has been chosen **by the user**. If `options.md` exists, name the option the plan implements. If no options were weighed, say so and offer `strategy-options`; proceed only if the user wants the plan anyway.
3. Read the project's own conventions for plans and decisions (for example an existing plan document, ADRs, a decisions log) and follow them.
4. Size the work. The facts are in the message and the plan is wanted in the reply: use the steps below for the thinking and "Answering in the reply" for the shape. For a run, copy `templates/plan.md` from this skill's folder to `plan.md` in the run's work directory.

## Steps
1. **Outcome.** The change in user behaviour or results the plan exists to produce, with a measure, a target and a date. Outputs ("ship the chat page") go under milestones, never here.
2. **Who and what problem.** Two or three sentences: the user, the situation, the opportunity addressed, with claim ids. Anyone reading only this part should understand why the work matters.
3. **Non-goals.** What this plan will deliberately not do, including tempting adjacent things, each with a reason. Non-goals protect the plan when new ideas arrive: a later addition takes something out or moves the date, and the plan says which. Good ideas that are out go on a short "not now" list so they are not lost.
4. **Assumptions, then the riskiest one.** List what must be true for the plan to work, across value, usability, feasibility and viability. Rate each by *how unsure we are* and *how bad it is if wrong*. The riskiest assumption is the one highest on both. Design the cheapest test that could prove it false, with a pass/fail threshold fixed in advance.
5. **Milestones.** Order them so that:
   - the first milestone tests the riskiest assumption, before anything expensive is built;
   - each one delivers something a user can use or a question answered, not a layer of architecture;
   - each ends in an explicit decision: continue, change, or stop;
   - each has exit criteria that can be checked by observation;
   - whatever protects privacy, money or data is built and tested before the first step that touches the real thing.
   Give sizes as ranges with the basis of the estimate; promise dates only where the user asked for them. When dates are given, put the milestones on the calendar and say where holidays or known absences fall.
6. **Metrics.** One primary metric tied to the outcome; one or two leading indicators that move early; and guardrails that must not get worse (for example running cost, privacy, reliability, response time). For each: definition, how it is measured, current value if known, target.
7. **Kill criteria.** Observable conditions under which the work stops or changes direction, set now while there is nothing to defend. Include a cost limit and a time limit.
8. **Risks and dependencies.** From the pre-mortem: top risks with owner, warning sign and mitigation. External dependencies with what happens if each changes its terms or price.
9. **Open decisions** the user must make, in two groups: those that block the first milestone, each with your recommended default, and those that can wait, each with the date by which it starts to block.
10. **Predict and check** (a run). `pmr predict add` for the first milestone's test result. `pmr lint <topic>`. Send to `red-team` when the plan commits to a one-way door.

Method detail: `references/plan-method.md`.

## Answering in the reply
The plan in one paragraph first: what will exist, for whom, by when, and the test that decides whether to go on. Then, once each: the outcome and its measure; non-goals; the riskiest assumption with its test and threshold; the milestones, each with what is usable at its end and the decision taken there; kill criteria; the decisions that block the first step. Give the first working session a finish line that can be observed ("signed in on your phone you see the real list; signed out you see nothing"). For a plan one person will carry out, write no user stories and no priority tiers, and do not restate the evidence they gave you.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Quality bar
- A reader can tell from the first screen what will exist, for whom, why, and how we will know it worked.
- The first milestone is cheap and could end the project.
- Every milestone has exit criteria and a decision.
- Kill criteria are specific enough that two people would agree whether they were met.
- Estimates show their basis. Unknowns are listed, not padded into the numbers.
- The plan follows the host project's rules (flags, environments, review, decision records). Read them; do not assume.

## Never
- Never present a feature list with dates as a plan.
- Never sequence the easy or interesting work first when a riskier assumption remains untested.
- Never write the plan into the project's decision log or roadmap yourself. It is a proposal until the user accepts it.
