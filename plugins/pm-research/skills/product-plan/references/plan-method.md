# Planning method

## Outcomes over outputs
| Output | Outcome |
| --- | --- |
| Ship the web chat | The owner uses the assistant from a browser on at least five days a week within a month of release |
| Add citations | Answers are checked against their source in under ten seconds, and wrong answers are caught before being acted on |

A plan may deliver every output and miss the outcome. Measure the outcome.

## Assumption mapping
List assumptions as "We believe that …". Place each on two scales:

```
                 high impact if wrong
                        │
     known, important   │   LEAP OF FAITH  ← test these first
   ─────────────────────┼─────────────────────
     known, minor       │   unknown, minor
                        │
                 low impact if wrong
        strong evidence ─────────── weak evidence
```

Sources of assumptions: each of the four risks; every "users will …" sentence; every dependency on a third party; every number in the cost estimate.

## Tests, cheapest first
| Test | Answers | Cost |
| --- | --- | --- |
| Use an existing tool to mimic the experience for a week | value | hours |
| Concierge: do it by hand for the user | value | hours to days |
| Fake door or waiting list | value, for products with outside users | hours |
| Paper or clickable prototype | usability | hours to days |
| Technical spike on the hardest part | feasibility | days, time-boxed |
| Cost model with real prices and measured usage | viability | hours |
| Thin end-to-end slice for one user | all four, weakly | days to weeks |

Before running a test, write down: the assumption, what you expect, the threshold for pass and fail, and what you will do in each case. A test with no stated threshold always passes.

## Milestones
Each milestone:
- **Goal**: the question answered or the capability a user gains.
- **Scope**: the least work that achieves the goal.
- **Exit criteria**: observable checks.
- **Decision**: continue, change or stop, and who decides.
- **Size**: a range, with its basis (similar past work, a spike, a count of parts).

Prefer thin vertical slices (one narrow thing working end to end) to horizontal layers (all the storage, then all the logic, then all the interface). A slice can be used and judged; a layer cannot.

Sequence by risk retired per unit of effort. Leave polish and scale until the value is shown.

## Metrics
- **Primary**: the outcome's measure. One.
- **Leading indicators**: move within days and predict the primary (first-day success, repeat use in week one).
- **Guardrails**: must not degrade (cost per month, error rate, latency, privacy incidents, maintenance hours).

Good metrics are defined precisely (numerator, denominator, window), can be measured with what exists, and would change a decision. For a single-user product, counts and a short usage diary are legitimate measures.

## Kill criteria
Decide in advance, while calm:
- the riskiest-assumption test fails its threshold;
- running cost exceeds a stated limit for a stated period;
- the primary metric has not moved by a stated date;
- a dependency changes in a stated way (price, terms, shutdown);
- total effort passes a stated limit without reaching a stated milestone.

Each needs a number or an observable event, and a named consequence: stop, shrink scope, or return to options.

## One-pager outline
For a short plan, this order works: problem and who has it → outcome and measure → approach in three sentences → non-goals → riskiest assumption and first test → milestones → kill criteria → open decisions. If it does not fit on one page, the thinking is not finished.

## Estimation honesty
- Give ranges. The width of the range is information.
- State the basis. "Similar to the earlier adapter, which took about a week" is a basis; "should be quick" is not.
- Separate building from operating. Many plans fail on upkeep and running cost, not on the build.
- List what is unknown and schedule the work that will make it known.

## Fit with the host project
Read the project's rules before writing milestones: where plans and decisions are recorded, how features are gated and rolled out, which environments may be touched, what review is required. Reference those rules in the plan instead of restating them. The plan is input to the project's own process, never a way around it.
