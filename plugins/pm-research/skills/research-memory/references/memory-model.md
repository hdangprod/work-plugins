# Memory model

## Shared memory (method)
Location: printed by `pmr paths`. Default is a `.pm-research` directory in the user's home; `PM_RESEARCH_HOME` overrides it.

| File | Content | Limit |
| --- | --- | --- |
| `profile.jsonl` | how the owner works: `{id, area, rule, status, first, updated}`, status `observed` or `confirmed` | 24 rules, 160 characters each |
| `lessons.md` | one line per lesson | 60 lessons, 8 KB |
| `retired.md` | retired lessons with date and reason | none; never loaded into context |
| `mistakes.jsonl` | every recorded mistake, with the lesson it led to | none; read through `pmr mistake list` |
| `sources.jsonl` | per domain: supported, partial, refuted, unreachable counts and notes | one row per domain |
| `calibration.jsonl` | predictions with probability, due date and outcome | none |
| `proposals/P-###.md` | proposed changes to the plugin with status | one file each |
| `usage.json` | when each lesson was last recalled | internal |
| `forgotten.jsonl` | tombstones so ids are never reused | internal |
| `sessions/<id>.json` | per-session marker for the stop reminder; removed after 14 days | internal |

Lesson line format:

```
- L-012 (2026-11-19, ×3, active, deep-research) quoting a price → open the vendor's pricing page and copy the sentence · enforced by: none
```

`×3` is how many times the situation occurred. `enforced by` names the mechanism (a lint rule, an eval case, a skill step) once one exists; until then the lesson depends on being recalled.

## Project memory (content)
Declared in `.pm-research.json` at the project root:

```json
{ "project": "name", "reports_dir": "docs/research", "work_dir": "docs/research/_work", "context_file": "docs/research/CONTEXT.md", "refresh_days": 60, "language": "en", "private_terms": [] }
```

`context_file` is optional. It names a short markdown file the owner writes: what this project is, its hard limits, what is already decided and what is not confirmed. `pmr recall` prints its first 40 lines after the shared working-style rules, and it overrides them where they disagree.

Per run, in `<work_dir>/<topic>/`: `run.json`, `brief.md`, `evidence.jsonl`, `claims.jsonl`, working files, `after-action.md`. The published report is `<reports_dir>/<topic>-YYYY-MM.md`. `<work_dir>/index.md` lists all runs.

Evidence row: `{id, url, domain, quote, tier, title, published, accessed, note, by}`. Quote at most 600 characters, verbatim.
Claim row: `{id, text, kind, sources, checks}`. Text at most 300 characters. `checks` maps each source id to its verdict.

## Why these limits
- **Small files loaded often beat large files loaded never.** A model reads the first screen of a memory file carefully and the tenth screen not at all. Sixty one-line lessons are read; a 40 KB journal is not.
- **Recall, not preload.** Only lessons matching the skill and topic enter context. Everything else stays on disk.
- **Append with ids, never rewrite.** A model that rewrites its own memory file loses entries silently. `pmr` appends, edits one entry by id, or tombstones; it never regenerates a file from the model's summary.
- **History is kept outside the hot path.** Retired lessons and raw mistakes are stored but not loaded.
- **Privacy by construction.** Shared memory is checked against the project's private terms on every write.

## Lifecycle of a lesson
```
mistake (M-###) ─ distil ─> lesson: candidate ─ recurs ─> active ─ recurs, nothing enforces it ─> proposal (P-###)
                                                                                                    │ owner approves
                                                                           lesson: enforced by <mechanism> <┘
unused for many runs, or superseded ─> retired (with reason)
```

## What never goes into shared memory
- Names of the project's customers, partners, unreleased features or internal systems.
- Numbers from the project's own data.
- Quotes from private notes or documents.
- Anything the user asked to keep private.

Write the method, not the case: "check whether a connector needs a paid plan before recommending it", not the product and the price that taught it.
