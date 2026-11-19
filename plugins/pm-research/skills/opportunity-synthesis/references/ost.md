# Opportunity Solution Tree

Teresa Torres's structure for keeping discovery tied to an outcome:

```
outcome
├── opportunity
│   ├── narrower opportunity
│   │   ├── solution ── assumption tests
│   │   └── solution
│   └── narrower opportunity
└── opportunity
```

This skill builds the top two layers (outcome and opportunities). `strategy-options` adds directions and `product-plan` adds assumption tests.

## Outcome
- A change in behaviour or results that can be measured, within the team's influence.
- Product outcome (users do X more or sooner) is better than business outcome (revenue) for steering discovery, because the link from work to result is shorter.
- For a personal product the outcome may be the owner's own: "I find any past note in under ten seconds", "I use it daily without thinking about it".

| Weak | Strong |
| --- | --- |
| Launch a chat interface | The owner asks the assistant instead of searching manually, at least daily |
| Improve search | A saved item is found on the first query in 9 of 10 attempts |

## Opportunities
An opportunity is a need, pain or desire, framed from the user's side, that would move the outcome if addressed.

| Not an opportunity | Rewritten |
| --- | --- |
| Add tags | I can't find things again once I have many of them |
| Offline mode | I lose ideas when I have no connection |
| Cheaper plan | I'm not sure it is worth paying for what I'd use |
| Use a better model | I don't trust the answers enough to act on them |

Tests for a well-formed opportunity:
1. It could be said by a user, in their words.
2. More than one solution could address it.
3. It is specific to a situation ("when I'm reviewing the week"), not a general wish ("be faster").
4. Evidence for it exists in the ledger.

## Structuring the tree
- Group by moments in the user's journey or by job step; these produce distinct siblings more reliably than grouping by theme.
- A parent is the sum of its children: addressing all the children addresses the parent.
- Go deeper until a leaf feels addressable in one focused effort.
- An opportunity that fits under two parents is usually framed too broadly; split it.

## Comparing opportunities
Compare siblings with each other, not across the whole tree at once. For each, write one or two sentences on:

| Lens | Question | Evidence to use |
| --- | --- | --- |
| Reach | How many of the people we care about meet this, and how often? | theme counts and source mix; segment notes |
| Intensity | What does it cost them when it happens? | severity, workarounds, switching stories, money spent |
| Served today | Who addresses it, how well, and is the gap durable? | teardown weaknesses and their kinds |
| Fit | Does it suit our strengths, constraints and direction? | the project's own docs; the owner |
| Evidence | How sure are we that it is real? | claim confidence |

Choose the target by argument. If two are close, prefer the one with stronger evidence or the cheaper first test.

## From weaknesses to opportunities
A competitor's weakness is evidence for an opportunity only when:
- real users are hurt by it (user voice, not just your own reading of the product);
- it is structural, neglected or by design, not already being fixed;
- we have a reason to believe we can do better without inheriting the same constraint.

Ask of each: why have they not fixed it? The answer tells you whether you can.

## Common mistakes
- A tree of features with an outcome on top.
- One enormous opportunity ("users want it to be easier").
- Opportunities taken only from complaints, missing what delights users and must be preserved.
- Ranking by gut feeling and then decorating it with numbers.
- Treating the tree as finished. It changes whenever new evidence arrives.
