---
name: deep-research
description: Use when the user asks to research, investigate, look into or find out something about a product, vendor, market or technical question, or asks questions to be answered from pages, documents or notes they supply, including when the answer is wanted in the reply, and when another pm-research skill needs evidence collected and verified. Do not answer such questions from memory. It ties every statement to a quoted source, weighs sources by who wrote them and when, shows contradictions instead of smoothing them, leaves unknowns open and turns each one into a next step. For a full run, parallel scouts fill an evidence ledger, an independent verifier checks every claim against its source, and a cited report is written.
---

# Deep research

The order is fixed: **quote → claim → verification → prose**. Prose written before verification is where invented facts get in.

## Before you start
1. `pmr recall --skill deep-research --topic "<topic words>"` and apply what it prints.
2. Size the work. The pages are in the message, or nothing can be fetched: answer in the reply (next section). Otherwise `pmr run status <topic>`; no run or an unfinished brief: use `research-plan` first.
3. For a run, read `brief.md`. The questions, the source plan and the stop rule are your contract.

## Answering from supplied material
The same order applies in your head: quote, claim, check, prose.
1. **Answer each question first**, in the owner's order, each with its confidence.
2. **Weigh each source** by who wrote it and when: the vendor's current page over an older one, a dated page over an undated one, first-hand over a forum, and any of them over your memory of the product. Say when a page may be stale.
3. **Keep the conditions the source states** ("billed annually", "in beta", "accounts opened before June").
4. **Show contradictions** between sources, with the side you weight and why. Do not average them.
5. **Label what you derived.** A monthly total you worked out is your arithmetic; show it as such.
6. **Leave open what the material does not say, and make each open point actionable**: the exact question to put to the vendor, the cheap way to check, and what to do meanwhile so the owner is not exposed (pay monthly while a feature is in beta).

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## 1. Collect evidence
Launch one `web-scout` agent per question, in parallel (2–3 for `standard`, 4–6 for `deep`; for `quick`, read up to 8 pages yourself). Give each scout:
- the one question, word for word from the brief;
- the tiers to prefer and named starting points from the source plan;
- a page budget (10 is a good default);
- the instruction to look for evidence against the hypothesis as well as for it.

Do not tell scouts what you hope to find.

Scouts return JSON lines. Record them without editing the quotes:
```bash
pmr evidence import <topic> --stdin <<'EOF'
…rows…
EOF
```
Read the `gaps:` line of each scout. A gap on an important question means one more targeted scout or an entry under Open questions, not a guess.

Tiers and what each may be used for: `references/source-ladder.md`.

## 2. Register claims
Read the ledger (`pmr evidence list <topic> --full`) and write the claims it supports:
```bash
pmr claim import <topic> --stdin <<'EOF'
{"text": "The Pro plan costs 20 USD per user per month when billed annually", "kind": "fact", "sources": ["E-003"]}
{"text": "Long-session context loss is the most common complaint", "kind": "inference", "sources": ["E-010", "E-011", "E-014"]}
{"text": "Does the API expose conversation memory?", "kind": "unknown"}
EOF
```
- One claim, one checkable statement, at most 300 characters. Keep the conditions the source states ("billed annually", "up to", "in beta").
- `fact`: the source says it. `inference`: you conclude it from several rows. `unknown`: a question the evidence could not answer.
- A load-bearing fact on a one-way door needs an `official` or `primary` source. If it has only `third` or `community` support, look again or call it tentative.
- Do not register what you remember but did not find. Memory is not a source.

## 3. Verify every pair
```bash
pmr claim list <topic> --pairs
```
Give that output to the `claim-verifier` agent (batches of about 20 pairs; several verifiers in parallel for a large register). Pass only the pairs, never your reasoning. Record its rows:
```bash
pmr claim verify <topic> --stdin <<'EOF'
…rows…
EOF
```
Then act on the result (`pmr claim list <topic> --status <status>`):
- `refuted`: stop citing it. Log `pmr mistake add --source verifier --skill deep-research --topic <topic> --what "…"`. If the question still matters, search again.
- `partial`: register a corrected claim that says only what the source says, verify that one, and drop the old one.
- `contested`: keep both sides for the Contradictions section.
- `unreachable`: find another source or move it to Open questions.

Details and the reasons behind the rules: `references/verification.md`.

## 4. Check the stop rule
Stop when every question in the brief has a verified answer or an honest "open, because …", or when the budget is spent. If a finding overturns the brief (the decision is the wrong one, a question is missing), tell the user before continuing.

## 5. Write the report
Start from `templates/report.md` in this skill's folder and write to the report path that `pmr run status <topic>` shows.
- Lead with the answer: the recommendation and its confidence in the first lines.
- Every finding carries `[C-###]`. A direct quotation carries `[E-###]`.
- Mark inference as inference ("This suggests …"). Put what is unknown under `## Open questions`.
- Show disagreements under `## Contradictions`, with which side you weight more and why.
- Compare hypotheses from the brief with what was found; say where you were wrong.
- Paste the output of `pmr report sources <topic>` under `## Sources`.
- `refresh_after` is the verified date plus the project's refresh window (`pmr paths`), or sooner for prices and fast-moving products.

Then `pmr lint <topic> --strict` until it prints `lint ok`.

## 6. Hand over
- `standard` and `deep`: run `red-team` on the report before presenting it as final.
- Record what the recommendation predicts: `pmr predict add --topic <topic> --text "…" --p 0.NN --due YYYY-MM-DD`.
- Finish with `research-retro`.
- Tell the user: the answer, the confidence, the two or three findings that carry it, what is still open, and the report path.

## Without subagents
Do the same steps in sequence yourself, with two rules that keep the separation real:
- Collect per question in separate passes, recording rows as you go, before forming any conclusion.
- Verification is its own pass after all claims are registered: re-open every URL and judge each pair as if someone else had written the claim. Record verdicts with `--by self-check`.

## Never
- Never cite a claim that is `unverified` or `refuted`.
- Never quote a search snippet or a page you did not open.
- Never repair a quote, merge two quotes, or translate inside a quote.
- Never drop a contradiction because it complicates the story.
