# Options method

## Rumelt's kernel
Good strategy has three parts:
1. **Diagnosis**: what is going on; the one or two critical aspects of the situation.
2. **Guiding policy**: the overall approach chosen to deal with it, which rules things out.
3. **Coherent actions**: steps that reinforce each other in carrying out the policy.

Bad strategy shows up as: goals in place of a plan ("be the best assistant"), a list of unrelated initiatives, refusing to choose, and fluff. If an option's guiding policy rules nothing out, it is not a policy.

## Cagan's four risks
| Risk | Question | Typical evidence | Cheap test |
| --- | --- | --- | --- |
| Value | Will people choose to use or buy it? | switching stories, workarounds, willingness to pay elsewhere | fake door, concierge version, a landing page, using it yourself for a week |
| Usability | Can they work out how to use it? | confusion themes, first-run complaints about similar products | paper or clickable prototype with three people |
| Feasibility | Can we build and operate it with what we have? | docs, limits, quotas, a spike | a time-boxed technical spike on the hardest part |
| Viability | Does it work for the business or owner: cost, legal, privacy, upkeep? | pricing pages, terms, running-cost arithmetic | a cost model with real prices; read the terms |

Most failed products fail on value. Test it first unless feasibility is truly in doubt.

## Lenses for generating options
- **Segment**: who else could this serve; who should it deliberately not serve?
- **Opportunity**: which other leaf of the tree could be the target?
- **Scope**: the smallest thing that delivers the core value; the version with no compromises.
- **Mechanism**: build, buy, integrate with an existing tool, or change the process instead.
- **Timing**: now, later when something specific becomes true, or never.
- **Inversion**: what would guarantee failure? Avoid that.
- **Competitor's chair**: what would the strongest competitor do with our position?
- **Constraint removal**: if cost or time were no object; if we had a tenth of the budget.

## Options that differ in kind
| Same option in three sizes | Three options |
| --- | --- |
| Build a basic chat UI / a full chat UI / a chat UI with voice | Build our own chat UI / use an existing assistant app through an open protocol / improve the current channel and build nothing |

Test: does each option imply a different guiding policy and a different riskiest assumption? If two share both, merge them.

## Do nothing
Always a real option. Argue it properly:
- What happens to the outcome if we wait six months?
- What do we save (effort, cost, attention, optionality)?
- What becomes cheaper or clearer by waiting (a standard settling, a price falling, a competitor proving or disproving demand)?
- What does waiting cost (learning lost, a habit not formed, a window closing)?

If "do nothing" wins, that is a successful result of research.

## Comparing
- Fix criteria first; mark which matter most.
- Use strong / mixed / weak with a reason per cell. Numbers imply precision the evidence rarely has.
- Look for dominance: an option worse on everything can be dropped; one better on everything deserves suspicion (what did we miss?).
- Sensitivity: which single cell, if wrong, flips the choice? That cell names the next piece of research.

## Reversibility
| Door | Meaning | How to decide |
| --- | --- | --- |
| Two-way | cheap to undo | decide quickly on moderate evidence, then learn by doing |
| One-way | expensive or impossible to undo (data migration, public commitment, lock-in, trust) | slow down, test the riskiest assumption first, get a red-team review |

Prefer a sequence that converts a one-way door into two-way steps: a test, a pilot, a reversible first release.

## Pre-mortem (Gary Klein)
Assume the option was chosen and failed. Write the story of the failure. Imagining failure as certain surfaces reasons that optimism hides.

For each cause: likelihood (high, medium, low), an early warning sign you could observe, and a mitigation or a test. Typical causes worth checking: nobody wanted it; too hard to start using; running cost grew; a dependency changed its terms or price; a platform shipped the same thing free; upkeep outgrew the time available; the owner's own need changed.

## Confidence and calibration
- State confidence as a probability that the recommended option will prove the right choice by a named date and criterion.
- 90% means wrong one time in ten. If you cannot name what the one time looks like, the number is too high.
- Check `pmr predict report`: if past 80% predictions came true 60% of the time, lower today's numbers accordingly.
- "What would change my mind" lists observable events, not feelings: "a second independent source shows running cost above X", "the prototype is not used on three of seven days".
