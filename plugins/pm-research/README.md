# pm-research

Deep product and competitor research with a product manager's discipline, for Claude Code and any tool that reads the open `SKILL.md` format.

Three things set it apart from a collection of PM frameworks:

1. **An evidence ledger.** Every finding is a claim tied to a verbatim quote from a page that was opened. A separate verifier checks each claim against each source before the claim may be cited. Published measurements of research agents put the share of wrong citations between roughly a tenth and a half; the ledger exists because of that.
2. **Decisions, not summaries.** Research starts from the decision it serves, weighs at least three directions including doing nothing, and ends in a recommendation with a confidence and the conditions that would change it.
3. **A learning loop the owner controls.** Mistakes become one-line lessons that are recalled at the start of later work. A lesson that keeps recurring becomes a proposal to change the plugin itself, and only the owner can approve it.

It also adapts to the person using it: a short list of working-style rules shared by all projects, and one context file per project.

## Skills

| Skill | Use it to |
| --- | --- |
| `pm` | Start any product question: loads the principles, recalls working style, project context and lessons, sizes the work, routes to the right skill |
| `research-plan` | Turn a request into a brief: decision, questions, hypotheses, sources, depth, stop rule |
| `deep-research` | Answer questions from supplied pages, or run a brief: scouts, evidence ledger, claim verification, contradictions, cited report |
| `competitor-teardown` | Take one product apart: what the vendor says, what the product does and what users report, kept apart; then what to copy, avoid and exploit |
| `market-map` | Map alternatives (direct, indirect, substitute, doing nothing), segments and white space, fitted to what the owner's product is for |
| `voice-of-customer` | Read reviews and comments: themes counted by person, severity kept apart from evidence of leaving, the vendor's replies checked against the timeline |
| `opportunity-synthesis` | Turn findings into an opportunity tree and a table of competitor weaknesses worth addressing |
| `strategy-options` | Split the problem into pains and cheap fixes, compare three or more directions including doing nothing, recommend one with the signs that would change the answer |
| `product-plan` | Turn the chosen direction into outcome, non-goals, riskiest-assumption test, milestones, metrics, kill criteria and the decisions that block the first step |
| `red-team` | Challenge the owner's own memo or plan as a cold reader, or have an independent reviewer challenge a report, options paper or plan |
| `research-memory` | Recall, record, correct, forget and audit what the plugin remembers, including the working-style rules |
| `research-retro` | Close a run, distil lessons, check predictions, propose changes to the plugin |

In Claude Code the skills appear as `pm-research:<skill>`. Asking a product question in plain words is enough; `pm` routes it.

## Two sizes of work, one kind of reply

| Situation | What happens |
| --- | --- |
| The material is in the message, or the question is small and easy to reverse | The skill is used for its judgement and the answer is written in the reply. No run, no template, no ledger. |
| Evidence has to be collected, the decision is hard to reverse, or a report was asked for | A run is opened and the artefact is written to a file (next section). |

Either way the reply follows one page of rules, `skills/pm/references/reply.md`: answer first, print only what the evidence can fill, say each thing once, nothing about the plugin's own steps, label derived figures, end with the next action, and stay within the length table. The ten skills that write for the owner carry the same sentence pointing at that page, and a test fails if one drifts. To change how every reply reads, edit that one page.

Agents: `web-scout` (finds and quotes pages; cheap model), `claim-verifier` (checks one claim against one source), `critic` (reviews a document without seeing the author's reasoning). All three are read-only.

## A research run

```
brief ─► evidence ─► claims ─► verification ─► report ─► red team ─► prediction ─► after-action ─► closed
research-plan   deep-research (web-scout, claim-verifier)        red-team      research-retro
```

`pmr run status` always says what the next step is. A run cannot be closed without a lint-clean report, a recorded prediction and an after-action that names its lessons.

## Memory

| Tier | Where | Holds |
| --- | --- | --- |
| Shared method memory | a folder in the user's home directory named `.pm-research` (override with `PM_RESEARCH_HOME`) | working-style rules (at most 24), lessons (at most 60, 8 KB), mistakes, source reliability by domain, predictions, proposals |
| Project research records | the folders named in the project's `.pm-research.json` | per topic: brief, evidence and claim ledgers, working files, report, after-action |
| Project context | the file named as `context_file` in `.pm-research.json` | what the product is for, hard limits, what is already decided, what is not confirmed |

All writes go through the `pmr` command, which gives every record an id, enforces the budgets and keeps history. A hook blocks direct edits to memory files and ledgers. `pmr lesson add` and `pmr profile add` refuse text containing the project's `private_terms`, so project details do not leak into shared memory.

## Working style and project context

`pmr recall` prints three things at the start of every skill, in this order: how the owner works, this project's context, and the lessons that match the task.

- **Working-style rules** are one line each and apply in every project. A rule the owner stated is `confirmed` and is followed as an instruction. A rule the agent only noticed is `observed`: it is used as a default, shown in the session brief and the audit, and becomes an instruction only when the owner confirms it.
- **The project context file** is an ordinary file in the project, written and edited by the owner. Where it disagrees with a shared rule, the project wins.

```
pmr profile list                                   # every rule with its id and status
pmr profile add --source owner --area reply --rule "…"
pmr profile confirm W-006                          # an observed rule becomes an instruction
pmr profile set W-003 --rule "…"                   # reword
pmr forget W-004                                   # remove
```

A new project needs only `pmr init --context <file>` and a few lines in that file; the shared rules come along unchanged.

## Setting up a project

```
pmr init --name <project> --reports docs/research --work docs/research/_work
```

This writes `.pm-research.json`. Add `private_terms` there (names that must never reach shared memory). Then ask a product question, or start explicitly:

```
pmr run start <topic> --decision "…" --door two-way --depth standard
```

## Commands

`pmr help` prints the full list. The ones used most:

| Command | Purpose |
| --- | --- |
| `pmr run status [topic]` | where a run stands and its next step |
| `pmr recall --skill s --topic "…"` | working style, project context, then lessons, earlier work and weak sources relevant to a task |
| `pmr profile add` / `list` / `confirm` / `set` | how the owner works |
| `pmr evidence import` / `pmr claim import` / `pmr claim verify` | the ledger |
| `pmr lint <topic> [--strict]` | check artefacts against the rules |
| `pmr mistake add` / `pmr lesson add` / `pmr lesson hit` | record what went wrong and what to do next time |
| `pmr predict add` / `resolve` / `report` | calibration |
| `pmr proposal add` / `list` / `show` | proposed changes to the plugin |
| `pmr audit` / `pmr retro` | what needs attention; how the plugin is doing |
| `pmr forget <id>` | remove a record for good |

## Hooks (Claude Code)

| Event | Effect |
| --- | --- |
| SessionStart | up to 15 lines: open runs and their next step, due predictions, stale reports, pending proposals. Silent in projects without `.pm-research.json` |
| UserPromptSubmit | records the owner's `approve P-###` or `reject P-###` |
| PreToolUse (file edits) | blocks direct edits to memory and ledgers, and edits to the plugin's own files outside an approved proposal |
| PostToolUse (file edits) | lints a research artefact as soon as it is written |
| Stop | one reminder per session when a run touched in it has unverified claims or no after-action |

## How it improves itself

```
mistake ─► lesson ─► recalled at the start of later work ─► recurs with nothing enforcing it
        ─► proposal P-### with an exact diff ─► owner types "approve P-###"
        ─► applied on a branch, tested, logged in CHANGELOG with a re-check date ─► kept or rolled back
```

The plugin writes lessons and drafts proposals on its own. It never changes its own skills, checks or evals without the owner's approval of that exact proposal. Approval is read from the owner's own chat message by a hook; the agent has no command that grants it.

## Limits

- It reads public pages. It does not sign up for products, log in, or run them.
- User voice from reviews and forums is a self-selected sample; the skills say so and forbid prevalence claims.
- Hooks work in Claude Code only. Other tools get the skills and the CLI; run `pmr lint` and `pmr run status` by hand there.
- Verification reduces wrong citations; it does not make them impossible. Reports state their confidence and their open questions.
- The measurements in `evals/README.md` cover requests where everything needed is already in the message, and the skills were tuned on those same cases. On them the plugin's replies rank ahead of a capable model without it, except when choosing between options, where Anthropic's plugin is as good or better. Collecting and checking evidence from the web, and memory across sessions, have not been measured against anything yet.

## Scope and credit

This plugin covers discovery: research, comparison, choosing a direction and a first plan. For delivery work (specs, stakeholder updates, sprint planning, metrics reviews) Anthropic's `product-management` plugin in [knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) is a good companion and can be enabled alongside this one.

Four ideas here were adapted from that plugin after a side-by-side evaluation, restated in this plugin's own words with no text copied: the thinking-partner stance (hold a view, name the trap), frameworks as tools for thinking and not sections to print, open questions split into those that block and those that can wait, and the rule that an addition to scope takes something out or moves the date.

## Developing the plugin

```
cd plugins/pm-research && npm test          # unit tests, no dependencies
claude plugin validate --strict .           # manifest and structure
PMR_DEV=1 claude                            # a session allowed to edit the plugin's own files
```

Changes that come from lessons go through `research-retro` and a proposal. Direct development by a person uses `PMR_DEV=1`. Every change is noted in `CHANGELOG.md`.
