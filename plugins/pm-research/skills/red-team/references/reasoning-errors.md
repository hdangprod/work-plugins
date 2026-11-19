# Reasoning errors to look for

Nine checks, each with the question to ask, how it looks in product research, and the fix.

## 1. Survivorship
**Ask:** are we looking only at the products that succeeded?
**Looks like:** "successful apps all have feature X", with no look at failed apps that also had X.
**Fix:** search for products that tried the same thing and shut down or pivoted; read their post-mortems.

## 2. Sampling
**Ask:** who wrote this evidence, and who is missing?
**Looks like:** conclusions about "users" from store reviews (the extremes), one forum (power users) or a vendor's case studies (its best customers).
**Fix:** name the sample and its bias in the text; use at least three kinds of source; never state prevalence from self-selected samples.

## 3. Vendor voice
**Ask:** is this the company describing itself?
**Looks like:** capabilities, performance numbers or customer counts taken from marketing pages and repeated as fact.
**Fix:** mark as the vendor's claim; look for docs (what it really does), limits pages, and independent users. A vendor is reliable about its own prices and terms, unreliable about its own quality.

## 4. Staleness
**Ask:** when was this true?
**Looks like:** prices, limits, model names or feature lists from an article a year old; a review complaining about something since fixed.
**Fix:** check the date of every load-bearing source; re-open the vendor's current page; state "as of".

## 5. False precision
**Ask:** does the number deserve its digits?
**Looks like:** "TAM of $4.2B", weighted scores to one decimal, cost estimates without ranges, percentages from a sample of twelve.
**Fix:** ranges and plain words; show the arithmetic and the source of each factor; drop numbers that have no method behind them.

## 6. Confirmation
**Ask:** what did the author look for that could have proved them wrong?
**Looks like:** every source agrees with the hypotheses in the brief; no "contradictions" section; searches phrased to find support.
**Fix:** search for the opposite ("problems with", "why I left", "is overrated"); list disconfirming evidence, or say none was found and how hard it was looked for.

## 7. Smoothing
**Ask:** where did the sources disagree, and what happened to the disagreement?
**Looks like:** two prices, two dates or two accounts merged into one confident sentence; a contested claim cited as settled.
**Fix:** show both sides with their sources; say which is more credible and why, or that it is unresolved.

## 8. Solution first
**Ask:** was the answer chosen before the question?
**Looks like:** the analysis reads as a case for one option; alternatives are thin or absurd; the problem statement already contains the solution ("users need a chat UI").
**Fix:** restate the problem without the solution; require options that differ in kind; argue "do nothing" seriously.

## 9. Confidence
**Ask:** does the stated confidence match the evidence?
**Looks like:** "clearly", "obviously", 90% on a recommendation resting on two community posts; no statement of what would change the conclusion.
**Fix:** tie confidence to the weakest load-bearing claim; require observable conditions for changing course; compare with `pmr predict report`.

## Other things worth a look
- **Anchoring on the first product studied**: later products are described by how they differ from it.
- **Feature equals value**: "has X" treated as "users benefit from X".
- **Correlation**: "the market leader does X" does not show X made it the leader.
- **Sunk cost**: "we already built Y, so …" used as a reason to continue.
- **Planning optimism**: single-point estimates, no time for upkeep, no kill criteria.
- **Own-need projection**: the owner's need assumed to be everyone's. Fine for a personal product; say so.
- **Missing stakeholder**: privacy, running cost, legal terms or maintenance not considered.

## Severity
| Level | Meaning | What the author must do |
| --- | --- | --- |
| blocker | the recommendation may be wrong, or a load-bearing claim is not supported by its source | fix before presenting |
| major | weakens confidence or leaves a real alternative unexamined | fix, or state as a limitation and lower confidence |
| minor | clarity, precision, a non-load-bearing error | fix if cheap |

## Reviewing a plan
In addition: is the first milestone the cheapest test of the riskiest assumption? Could each milestone end the project? Are kill criteria observable? Is anything in the plan a one-way door taken without a test? Does it respect the host project's rules?
