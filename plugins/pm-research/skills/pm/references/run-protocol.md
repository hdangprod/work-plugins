# Run protocol

One run = one topic = one decision. `pmr run status <topic>` always prints the next step, derived from what exists on disk.

## Lifecycle
| Stage | Skill | Done when |
| --- | --- | --- |
| 1. Brief | `research-plan` | `brief.md` has no `TODO` left |
| 2. Evidence | `deep-research` or a lens skill | rows are in the evidence ledger |
| 3. Claims | same | claims are registered against evidence ids |
| 4. Verification | `claim-verifier` agent | no claim is `unverified` |
| 5. Analysis | lens skills | working files written and linted |
| 6. Report | `deep-research` or the lens skill | `pmr lint <topic> --strict` prints `lint ok` |
| 7. Challenge | `red-team` | findings answered or accepted |
| 8. Prediction | any | at least one `pmr predict add --topic <topic>` |
| 9. After-action | `research-retro` | `after-action.md` filled, mistakes distilled |
| 10. Close | `research-retro` | `pmr run close <topic>` succeeds |

## Files
`pmr paths` prints the real locations for the current project.

| File | Where | Written by |
| --- | --- | --- |
| `brief.md` | work dir / topic | `pmr run start`, then you |
| `evidence.jsonl`, `claims.jsonl`, `run.json` | work dir / topic | `pmr` only |
| `teardown-<product>.md`, `market-map.md`, `voc.md`, `opportunities.md` | work dir / topic | lens skills |
| `options.md`, `plan.md` | work dir / topic | `strategy-options`, `product-plan` |
| `red-team.md` | work dir / topic | `red-team` |
| `after-action.md` | work dir / topic | `pmr run retro`, then you |
| `<topic>-YYYY-MM.md` | reports dir | the one published report of the run |
| `index.md` | work dir | `pmr` only |

A run publishes exactly one report. Working files stay in the work directory; the report links to them.

## Commands
```bash
pmr run start <topic> --decision "Decide whether to …" [--door one-way|two-way] [--depth quick|standard|deep]
pmr run status [topic]

# evidence: one JSON object per line {url, quote, tier, title, published, note, by}
pmr evidence import <topic> --stdin <<'EOF'
{"url":"https://…","quote":"verbatim","tier":"official","title":"…","published":"2026-10-02","note":"Q1","by":"web-scout"}
EOF
pmr evidence list <topic> [--grep text] [--tier official] [--full]

# claims: {text, kind: fact|inference|unknown, sources: ["E-001"]}
pmr claim import <topic> --stdin
pmr claim list <topic> --pairs            # hand this to the claim-verifier agent
pmr claim verify <topic> --stdin          # rows {id, source, verdict, note, by}
pmr claim list <topic> --status refuted

pmr report sources <topic>                # lines for the report's Sources section
pmr lint <topic> [--strict]

pmr predict add --topic <topic> --text "…" --p 0.7 --due YYYY-MM-DD
pmr run retro <topic>
pmr run close <topic>
```

Use a quoted heredoc (`<<'EOF'`) for imports so quotes and dollar signs inside evidence survive the shell.

## Claim status
`unverified` → `supported` | `partial` | `refuted` | `contested` (sources disagree) | `unreachable`. Questions (`kind: unknown`) are `open`.

- `supported`: cite as fact.
- `partial`: reword the claim to what the source really says (add a corrected claim, forget or stop citing the old one).
- `refuted`: never cite. Log it: `pmr mistake add --source verifier --what "…"`.
- `contested`: present both sides under `## Contradictions`.
- `unreachable`: find another source, or move it to Open questions.

## When the session is interrupted
State lives on disk. In a new session, or after the context was compacted, run `pmr run status` and continue from `next:`.
