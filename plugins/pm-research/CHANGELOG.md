# Changelog

Every change to the plugin is listed here. A change that came from the learning loop names its proposal and lessons, states the effect it is expected to have, and gives the date on which that effect is checked. A change that did not have its effect is rolled back and the rollback is listed too.

Entry format:

```
## <version or date> — <title>
- Proposal: P-### (lessons L-###, L-###) | direct development
- Changed: <files>
- Expected effect: <observable result>
- Re-check: YYYY-MM-DD
- Result: pending | kept | rolled back (<why>)
```

## 2026-11-19 — replies that answer first, two sizes of work, working-style profile
- Proposal: direct development, requested by the owner after a side-by-side evaluation against Anthropic's `product-management` plugin and against no plugin (method and numbers: `evals/README.md`).
- Changed:
  - new `skills/pm/references/reply.md`: the one page that defines how a reply reads and how long it runs; the ten skills that write for the owner carry the same sentence pointing at it, and `test/package.test.mjs` fails if one drifts;
  - `pm`: sizes the work before routing (answer in the reply, or open a run) and no longer tells the model to announce what it could not run;
  - `strategy-options` and `voice-of-customer` rewritten around the thinking, with frameworks used to think and printed only where the evidence fills them; `red-team` gains a method for the owner's own memo or plan; `deep-research` gains a method for answering from supplied pages; `product-plan`, `market-map`, `competitor-teardown` and `research-plan` gain an in-reply shape; descriptions of `red-team`, `deep-research` and `market-map` reworded so the skills are picked up from plain requests;
  - `voice-of-customer`: themes are no longer ranked by one multiplied score; the template counts people and marks the switching and Kano sections as optional;
  - `competitor-teardown`: the reply opens with what to copy, avoid and exploit, each written as an instruction for the owner's own product with its page in brackets, followed by one evidence table (finding, voice, page and words quoted, people);
  - `strategy-options`: the owner's figures are quoted as given (a share is not turned into a count), every own estimate is marked, the recommendation names a listed option by number and name, and a pre-mortem comes with it;
  - working-style profile: `lib/profile.mjs`, the `pmr profile` commands, `context_file` in the project config, and recall, brief, audit and the guard hook wired to them;
  - five more eval cases (answer, challenge, market map, plan, voice of customer).
- Removed: the instruction to mirror template structure and labels in a reply; printed criteria grids, option matrices and second pre-mortems in replies; mandatory four-forces and Kano sections; commercial advice for a product the owner says is not for sale.
- Adapted from Anthropic's plugin, in this plugin's own words: the thinking-partner stance, frameworks as tools and not sections, blocking and non-blocking open questions, and the scope trade rule. Not adopted: priority tiers, user stories and fixed document templates, which blind judges marked down as rote for one-person decisions.
- Expected effect: in a blind ranking of nine replies per case, this plugin's average rank on the options, voice-of-customer and challenge cases moves from 8.0, 8.0 and 6.0 to 5.0 or better; replies stay within the length table; no reply mentions the plugin's own steps.
- Re-check: 2026-12-19, or after the third real research run if that comes first.
- Result: kept, with two of the three expected effects met on the eval cases (numbers and limits: `evals/README.md`); the re-check on real runs stays open.
  - Blind rank, now of twelve replies per case: voice of customer 2.00, challenge 2.67, options 5.67 (the earlier version in the same ranking: 9.67, 9.00, 9.67). Voice of customer and challenge meet the target. Options does not: Anthropic's plugin ranked 2.67 there, and a second ranking that put this plugin ahead (5.00 against 6.00 of fifteen) shows a tie at best.
  - Length: not met. Mean reply length fell from 1,027 to 819 words, but most cases still run over the length table.
  - No reply mentions the plugin or its steps: met (0 of 24).
  - Tried and not kept: a teardown reply sourced in prose only (the graders fell from 0.83 to 0.67 because findings lost their page), and two further wordings of the options reply (one squeezed out the riskiest assumptions, the other ran longer without ranking better).

## 0.1.0 — first version
- Proposal: direct development
- Changed: everything. Twelve skills (`pm`, `research-plan`, `deep-research`, `competitor-teardown`, `market-map`, `voice-of-customer`, `opportunity-synthesis`, `strategy-options`, `product-plan`, `red-team`, `research-memory`, `research-retro`), three read-only agents (`web-scout`, `claim-verifier`, `critic`), five hooks, the `pmr` command and its tests.
- Expected effect: a research run ends with every cited claim verified against its source, at least three options weighed, and at least one lesson or an explicit "none" recorded.
- Re-check: after the third real research run.
- Result: pending
