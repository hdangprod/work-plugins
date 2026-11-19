# Decision-first research

## Why the decision comes first
Research without a decision optimises for coverage. Research with a decision optimises for the few facts that could change the answer. The second is shorter, cheaper and more useful.

A good decision statement has an action, alternatives and a deadline:

| Weak | Strong |
| --- | --- |
| "Research note-taking apps" | "Decide whether to build our own capture interface or keep using a third-party chat client, before the next build cycle" |
| "Look at competitor pricing" | "Decide whether to launch with a free tier, given what the three nearest products charge" |
| "Find out what users think" | "Decide which of the two onboarding problems to fix first" |

## Reversibility sets the depth
| Door | Signs | Depth | Evidence standard |
| --- | --- | --- | --- |
| Two-way | undo in days; affects few users; little money | quick or standard | one good source per claim is acceptable; decide at about 70% confidence |
| One-way | data model, pricing model, platform choice, public promise, months of work | deep | load-bearing claims need a first-hand source; red team required |

Spending deep effort on a two-way door is as much a mistake as rushing a one-way door.

## Which source answers which question
| Question | Best source | Weak source |
| --- | --- | --- |
| What does it cost, what are the limits? | vendor pricing page and docs, dated | review blogs, comparison tables |
| What does the product actually do? | the product itself, docs, changelog, demo videos | marketing landing page |
| Where is the company heading? | changelog over 12 months, job posts, engineering blog, founder interviews | press releases |
| What do users struggle with? | app-store and marketplace reviews, forums, issue trackers, support docs | vendor testimonials |
| Why do users switch? | "moved from X to Y" threads, migration guides, comparison posts by users | analyst reports |
| How big is it? | filings, official usage numbers, with year and unit | "market size" articles with no method |
| Is it technically feasible for us? | API docs, rate limits, terms of use, our own prototype | forum hearsay |

## Good questions
- Answerable: a source could exist that settles it.
- Decision-linked: one answer favours option A, another favours option B.
- Falsifiable: phrased so the answer can be "no".
- Bounded: names the product, segment, region and time period.

Rewrite "Is the market big?" as "Do at least three products in this category charge individuals more than 10 USD a month, as of this quarter?"

## Hypotheses
Write them before searching, one line each with a probability:

```
- H1 (70%): the three leading products all gate memory behind a paid plan.
- H2 (40%): users complain more about lost context than about price.
```

In the after-action, compare them with what was found. Hypotheses that were confidently wrong are the richest source of lessons.

## Stop rules that work
- Budget: "at most 4 scouts and 40 pages".
- Saturation: "two scouts in a row add no claim that changes an answer".
- Sufficiency: "every question has at least one verified claim, or is listed as open with the reason".
- Time-box for two-way doors: decide with what you have.
