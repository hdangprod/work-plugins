# Verification of claim-source pairs

## Why it is a separate step
Studies of research agents published in 2026 found that between roughly one in ten and one in two of their citations do not support the sentence they are attached to: the link is dead, the page is about something else, or the page says something weaker. The author of a claim is the worst person to catch this, because they already believe it. So the check is done pair by pair, by a reader who sees only the claim and the source.

## The unit is the pair
A claim with three sources is three checks. A claim counts as verified only when every source it cites has a verdict.

| Verdict | Meaning |
| --- | --- |
| `supported` | the page states the claim with its numbers, units, scope and conditions |
| `partial` | the page supports a weaker or narrower statement |
| `refuted` | the page says something else or does not contain it |
| `unreachable` | the page could not be read |

Claim status is derived from its pairs:

| Pairs | Status | Do |
| --- | --- | --- |
| at least one supported and at least one refuted | `contested` | show both sides |
| not all checked | `unverified` | finish checking |
| all checked, at least one supported, none refuted | `supported` | cite as fact |
| refuted, none supported | `refuted` | never cite; log a mistake |
| partial at best | `partial` | rewrite to what the source says |
| only unreachable | `unreachable` | find another source |

## Common failures the verifier catches
- **Dropped condition.** Source: "from $20 per user/month, billed annually". Claim: "costs $20 a month".
- **Scope shift.** Source talks about the enterprise plan, the claim about the product.
- **Stale page.** The quote was true on an archived page; the live page differs.
- **Wrong subject.** A review of a product with a similar name.
- **Vendor adjective turned into fact.** "The most accurate" in marketing copy cited as a measured result.
- **Aggregation without basis.** "Most users complain about X" resting on three forum posts.
- **Quote not on page.** The quote was assembled from memory or from a search snippet.

## Working with the verifier
- Send pairs only: `pmr claim list <topic> --pairs`. Do not add context, the brief or your view.
- About 20 pairs per verifier keeps each one careful. Run several in parallel.
- Record the rows exactly as returned: `pmr claim verify <topic> --stdin`.
- Do not argue with a verdict in prose. If you believe a `refuted` is wrong, add better evidence and a new claim, and verify that.

## After verification
- The share of checked claims that failed is printed by `pmr run status`. Above about 20%, slow down: the collection step was careless, and the after-action should say why.
- `pmr` records, per domain, how often claims resting on it were supported or refuted. `pmr recall` warns about domains with a bad record; `pmr sources` shows the table.

## Without a verifier agent
Run the pass yourself, after all claims are registered and before any prose:
1. Print the pairs.
2. For each, open the URL again and read the passage in context.
3. Decide the verdict by the table above, as if a colleague had written the claim.
4. Record with `--by self-check`. Say in the report's `method:` line that verification was a self-check; it is weaker than an independent one.
