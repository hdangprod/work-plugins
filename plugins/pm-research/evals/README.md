# Evals

Eight cases for `claude plugin eval`, one per stage of the work. Every case carries its material in the prompt, so a case tests the judgement a skill carries and how its reply reads.

| Case | Skill under test | What the graders look for |
| --- | --- | --- |
| `brief-from-vague-request` | `research-plan` | a named decision, questions that could change it, scope and sources, and no findings before research |
| `answer-from-conflicting-pages` | `deep-research` | the current vendor pages win over memory, the cost for one person, the condition the answer depends on, and gaps left open |
| `teardown-from-saved-pages` | `competitor-teardown` | findings tied to the saved pages, the vendor's claim set against users' reports, an unknown left unknown, advice that follows |
| `market-map-from-saved-notes` | `market-map` | people who use nothing are counted, a poll is not a market size, a team product is another segment, "not for sale" is respected |
| `voc-from-saved-comments` | `voice-of-customer` | people are counted and not comments, staff and off-topic posts are set aside, what works is kept, advice is tied to evidence and says how far it carries |
| `options-with-do-nothing` | `strategy-options` | at least three options that differ in kind, doing nothing among them, a riskiest assumption for each, one recommendation with a numeric confidence and what would change it, correct use of the given numbers |
| `plan-from-chosen-direction` | `product-plan` | an outcome and its measure, the riskiest step first, the most wanted thing first, scope held, a plan that fits the time given and has a stop rule |
| `challenge-before-commit` | `red-team` | the arithmetic error, who actually answered, sunk cost, missing options, missing cost and success measure, and the problems ranked |

Each case also has a `skill-fired` grader. It shows whether the skill was picked up from a plain request and is not part of the score.

## Running

From the plugin folder. Evals spend model quota, so run one case while editing a skill and the whole suite before a change is kept:

```
claude plugin eval . --no-publish --judge-model sonnet --runs 3 --ablation none --case 'options-*' --max-cost-usd 3
claude plugin eval . --no-publish --judge-model sonnet --runs 3 --max-cost-usd 10
```

The second form runs each case with the plugin and without it. Results go to `evals/results/`, which is not committed. One `--case` per command: a second flag replaces the first.

## Blind comparison

The graders above check for things this plugin values, so they favour it. A change to how replies read is therefore also judged blind:

1. Save each arm's run with `--json <file>`. `node evals/blind/blind.mjs <pack dir> <key dir> <seed> after=<file> before=<file> none=<file>#without` writes one pack per case, with every reply under a random letter, and keeps the key in a separate folder.
2. Give one judge per case the pack and `evals/blind/rubric.md` and nothing else: six dimensions scored 1 to 5 (grounded in the material, answers the question, helps the decision, rigour, craft, economy) and a full ranking with no ties. The judge checks facts and arithmetic against the request, and writes its JSON to `<judged dir>/<case>.json`.
3. `node evals/blind/tabulate.mjs <judged dir> <key dir> --moves` joins the scores to the key and prints each arm's dimensions and average rank, with the moves and failures the judge named.

The judge is a stronger model than the one that wrote the replies. Keep packs, keys and judgements outside the repository.

## Results of 2026-11-19

Arms: this plugin after the reply rework, this plugin before it, no plugin, and Anthropic's `product-management` plugin (commit `b4c9a4e`) both as installed and with its matching skill forced. Replies by Sonnet, three runs per arm.

Graders (score, mean words in the reply):

| Case | No plugin | Anthropic, as installed | Anthropic, skill forced | Before | After |
| --- | --- | --- | --- | --- | --- |
| brief | 0.33 / 866 | 0.33 / 918 | 0.40 / 896 | 1.00 / 985 | 1.00 / 851 |
| answer | 1.00 / 553 | 0.89 / 555 | 1.00 / 861 | 1.00 / 611 | 1.00 / 673 |
| teardown | 0.71 / 668 | 0.63 / 630 | 0.75 / 981 | 1.00 / 1102 | 0.92 / 803 |
| market map | 0.88 / 745 | 0.78 / 741 | 0.93 / 1551 | 0.88 / 999 | 1.00 / 690 |
| voice of customer | 1.00 / 634 | 0.89 / 658 | 0.93 / 1042 | 0.92 / 1003 | 1.00 / 803 |
| options | 0.07 / 455 | 0.00 / 452 | 0.22 / 733 | 0.33 / 1125 | 0.94 / 805 |
| plan | 0.85 / 1001 | 0.90 / 904 | 1.00 / 1796 | 0.93 / 1803 | 1.00 / 1232 |
| challenge | 0.96 / 582 | 0.87 / 569 | 1.00 / 711 | 0.96 / 588 | 1.00 / 697 |
| Mean | 0.73 / 688 | 0.66 / 678 | 0.78 / 1071 | 0.88 / 1027 | 0.98 / 819 |

Skills picked up from a plain request: after the rework, the matching skill fired in 24 of 24 runs (before: `deep-research` and `red-team` in 0 of 3 each). Anthropic's skills fired in 0 of 24 runs as installed, which is why a forced arm was added.

Blind ranking of twelve replies per case (mean of the six dimensions / average rank, lower rank is better):

| Case | After | Before | No plugin | Anthropic, skill forced |
| --- | --- | --- | --- | --- |
| brief | 4.28 / 3.67 | 3.72 / 4.33 | 3.83 / 7.00 | 2.83 / 11.00 |
| answer | 4.44 / 2.00 | 4.11 / 6.33 | 3.78 / 8.67 | 3.78 / 9.00 |
| teardown | 4.28 / 2.33 | 4.06 / 4.67 | 3.67 / 8.33 | 2.89 / 10.67 |
| market map | 4.56 / 2.00 | 3.67 / 6.67 | 3.56 / 8.67 | 3.22 / 8.67 |
| voice of customer | 4.56 / 2.00 | 2.94 / 9.67 | 3.83 / 5.00 | 3.22 / 9.33 |
| options | 4.00 / 5.67 | 3.33 / 9.67 | 3.56 / 8.00 | 4.33 / 2.67 |
| plan | 4.33 / 2.33 | 4.06 / 5.00 | 3.83 / 8.00 | 2.94 / 10.67 |
| challenge | 4.44 / 2.67 | 3.44 / 9.00 | 3.78 / 8.67 | 4.06 / 5.67 |
| All | 4.36 / 2.83 | 3.67 / 6.92 | 3.73 / 7.79 | 3.41 / 8.46 |

This plugin has the best average rank in seven of the eight cases. No reply of the "after" arm mentions the plugin or its steps (0 of 24).

The options case is a tie, not a win. A second judge ranked the same replies again in a pack of fifteen and put this plugin at 4.28 / 5.00 and Anthropic's at 4.06 / 6.00, the reverse of the table above, and in both rankings the single best reply was one of Anthropic's. Its replies there are shorter and open with the sharpest diagnosis (which of the pains needs the expensive thing at all); this plugin's are stronger on leaving the owner's numbers as given, on arguing "do nothing" seriously and on countable signs. A third wording of `strategy-options` that tried to add that diagnosis sentence scored the same in the blind ranking (4.28 / 5.33), lower on the graders (0.89) and ran longer (866 words), so it was not kept.

## Limits

- The skills were edited against these eight cases and with the first round of judge notes in hand, so the "after" numbers are in-sample. Treat them as "the rework did what it was meant to do on these cases", not as a forecast for new requests. The re-check date in `CHANGELOG.md` is the out-of-sample test.
- Three runs per arm and one judge per case. A grader moving by one run in three is noise; the teardown case moved between 0.67 and 1.00 across runs of nearly the same text.
- The graders encode this plugin's values. The blind ranking is the fairer comparison, and inside it the "before" arm is the fair baseline.
- Cases use the read-only tools only, so `pmr`, web research, the subagents, the ledger and claim verification are not exercised. Those mechanics are covered by `npm test`; nothing here measures a full research run.
- Replies still run over the length table in `skills/pm/references/reply.md` in most cases (answer 673 words against 300 to 600; plan 1,232 against 1,000).
