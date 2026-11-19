---
name: strategy-options
description: Use when the user asks which way to go, what to build, whether to build, buy or wait, to weigh alternatives, to propose ideas, or for a recommendation on any product decision, including when all the facts are already in the message and the answer is wanted in the reply. Do not answer such a question without this skill. It splits the problem into its separate pains and the cheapest fix for each, sets out at least three options that differ in kind, always including doing nothing, names the riskiest assumption of every option, and recommends exactly one of them with a numeric confidence, the ways it could fail and the countable signs that would change the answer.
---

# Strategy options

The first idea is rarely the best one, and a single proposal cannot be evaluated; it can only be accepted or rejected. Put at least three real alternatives side by side, choose by argument, and say which one you would pick.

## Before you start
1. `pmr recall --skill strategy-options --topic "<topic>"`.
2. Size the work. Facts in the message and a two-way door: answer in the reply. Otherwise `pmr run status <topic>`, read the brief and the working files, and copy `templates/options.md` from this skill's folder to `options.md` in the run's work directory. A one-way door with no research behind it: say so and offer `research-plan` first.

## The thinking, in this order
1. **Split the problem.** List the separate pains inside the request, how often each occurs in the owner's own numbers, and the cheapest thing that would remove each: a setting, a habit, a small script, a feature of something they already have. Quote the owner's figures as given; do not turn a share into a count when the base was not given ("a third of orders" is not "ten orders a week"), and say what was not counted. What is left after the cheap fixes is the real decision, and it is often smaller than the request.
2. **Fix what the choice is judged on** before writing options: the two things that matter most to this owner, taken from the brief, the project context and their working-style rules. Criteria chosen afterwards fit the favourite.
3. **Diverge, privately.** At least six candidates through different lenses: another segment, another pain, the smallest useful thing, the ambitious version, build / buy / integrate / change the process, the opposite of the obvious. This list is for thinking; do not print it.
4. **Converge to three to five options that differ in kind**, not in size: "small, medium, large" of one idea is one option. Always include **do nothing / wait**, argued seriously: what waiting costs, what it saves, and what would have to be true for it to be right. When the best course is a sequence (a cheap test, then commit), make that sequence one of the listed options now, so the recommendation can name it.
5. **Give every option the same four things**, do-nothing included: what the owner gets that they lack today; the cost to build and to run, in the owner's figure or marked as your estimate where it appears; `Riskiest assumption:` the one belief that sinks the option if false, and the cheapest test of it; and whether it is a one-way or a two-way door. Use value, usability, feasibility and viability risk to find that assumption; print a risk only where it separates the options.
6. **Find what lasts.** Name the part of the work that keeps its value whichever option wins (the data, an interface other tools can use, a measurement) and point the first effort there.
7. **Recommend exactly one listed option, by the number and name it has in the list.** With it: `Confidence: NN%`; the two or three reasons that carry it; what is given up; a pre-mortem (it is a year on and this option failed: the two or three likeliest reasons, each with its early sign); and `What would change my mind:` as numbers the owner can count ("more than five sessions a week still hit the limit after the cheap fix"), plus the tally to keep. If the evidence cannot separate two options, the option that tests the difference is the recommendation.

## Answering in the reply
The first line names the recommended option as it is listed ("Recommendation: option 2, <its name>") with its confidence. Then the pains with their cheap fixes (a three-column table when there are several), each option in two or three sentences, and the pre-mortem and tripwires of the recommended option only. No criteria grid, no option-by-criterion matrix, no second pre-mortem: they are for the paper.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Writing the options paper (a run)
Fill `options.md`: the diagnosis with claim ids, the criteria, the options at equal depth, the comparison with a reason in each cell, the pre-mortem on the leader and briefly on the runner-up, and the recommendation. Then:
- `pmr predict add --topic <topic> --text "…" --p 0.7 --due YYYY-MM-DD` for at least one checkable consequence of the recommendation;
- `pmr lint <topic>`; for a one-way door or a `deep` run, send the paper to `red-team` before presenting it.

Method detail: `references/options-method.md`.

## Quality bar
- A reader could plausibly choose any of the options; none is a straw man.
- Every figure comes from the owner's material, or is shown as your own arithmetic or assumption.
- Evidence is cited where it carries weight; opinions are marked as judgement.
- Confidence is a number you would bet on, not a default 80%. `pmr predict report` shows how past confidence turned out.

## Never
- Never present one option with two decoys.
- Never recommend a blend that is not one of the listed options.
- Never hide the weaknesses of the option you favour.
- Never record a decision on the user's behalf. Options and recommendations are proposals until the user decides.
