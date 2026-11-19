# Source ladder and confidence

## Tiers
| Tier | What it is | Good for | Not good for |
| --- | --- | --- | --- |
| `official` | The vendor's pricing page, docs, changelog, terms, status page, engineering blog, filings | prices, limits, feature existence, stated direction | how well it works, what users feel |
| `primary` | First-hand data from someone other than the vendor: a dataset, a benchmark with its method, an interview transcript, a regulator's document, your own reading of the public product UI | behaviour, performance, usage | intent |
| `third` | Journalism, analyst reports, comparison sites, review articles | context, leads to follow | prices, numbers, feature claims (often stale or copied) |
| `community` | Forums, app-store and marketplace reviews, social posts, issue trackers | pain points, switching stories, vocabulary users use | prevalence ("everyone hates"), facts about the product |

Rules of thumb:
- Climb the ladder: when a `third` source states a fact, find the `official` or `primary` page it came from and cite that instead.
- Vendor copy is official about what the vendor **says**, not about what the product **does**. "Blazing fast" is positioning. "Rate limit: 60 requests per minute" is a fact.
- Community sources are primary evidence about the writer's own experience, and weak evidence about everyone else's.
- A date is part of the evidence. Undated pricing or feature pages are tentative.
- Two pages that copy the same press release are one source.

## Confidence
`pmr` derives it from tier and verification; use the same letters in prose.

| Letter | Meaning | How to write it |
| --- | --- | --- |
| **C** confirmed | an `official` or `primary` source says it and verification returned `supported` | state it plainly, cite `[C-###]` |
| **T** tentative | verification returned `supported`, but only `third` or `community` sources carry it | "reported", "according to", "users describe", cite it |
| **U** not established | not yet checked, partial, refuted, contested or unreachable | do not state it as fact; reword it, show the contradiction, or list it under Open questions |

## Search tactics that find first-hand material
- Pricing and limits: the vendor's `/pricing`, docs pages on quotas and rate limits, the terms of service.
- Direction: the changelog or release notes across 12 months; job posts (what they hire for is what they will build); the engineering blog.
- Behaviour: docs, API reference, demo videos, public templates, help-centre articles (each one documents a place users get stuck).
- Pain: reviews sorted by most recent and by lowest rating; "alternative to <product>"; "<product> vs"; "migrating from <product>"; "cancel <product>"; issue trackers sorted by reactions.
- Money: filings, funding announcements with dates, published customer counts with a year.
- Use the product's own vocabulary and its users' vocabulary; they often differ, and the difference is itself a finding.
- Search in the languages of the product's main markets, not only in English.

## Contradictions
When sources disagree:
1. Check dates: the newer first-hand source usually wins on facts that change (price, limits).
2. Check scope: region, plan and version often explain the difference.
3. If it remains, keep both. Register one claim citing both sources so that it becomes `contested`, and write it up under `## Contradictions` with what would settle it.

## Staleness
| Kind of fact | Typical shelf life |
| --- | --- |
| Prices, plan limits, model names | weeks to a few months |
| Feature availability | months |
| Company direction, positioning | 6–12 months |
| User jobs and pain | years |

Set `refresh_after` by the shortest-lived fact the recommendation depends on.
