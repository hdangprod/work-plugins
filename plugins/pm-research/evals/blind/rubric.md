# Judging rubric (fixed before any reply was read)

You are judging replies written by different assistants to the same request from one person. The replies are in random order under letter labels. You do not know which assistant wrote which, and you must not try to find out: read only the pack file you are given and this rubric, nothing else on disk.

The person who asked is a solo builder who makes decisions alone, has little time, and wants an answer they can act on. They did not ask for a long document.

Score every reply on each dimension from 1 (poor) to 5 (excellent). Use the whole scale; do not give everything 4.

1. **grounded** — Every factual statement can be traced to the material in the request. Nothing is invented (no made-up numbers, features, prices, quotes, dates). Arithmetic on the given numbers is right. Check this against the request text yourself; do not trust the reply's own claims of being grounded.
2. **answers** — It answers what was asked, including each sub-question, and respects the constraints stated in the request (for example "not for sale", "no web access", "one user", a time budget).
3. **decision** — After reading it the person knows what to do next and why. The recommendation or conclusion comes early and is specific.
4. **rigour** — It separates fact, inference and unknown; shows contradictions in the material instead of smoothing them over; states how sure it is and what would change the conclusion; considers real alternatives, including not acting, where the request involves a choice.
5. **craft** — Quality of the product-management thinking itself: the right method for this problem, applied to this person's case and numbers, with insight a generic answer would not have. Penalise frameworks applied by rote and filler sections.
6. **economy** — Length is earned. No repetition, no boilerplate, no section that the person could delete without loss. A shorter reply that carries the same substance scores higher.

Then:
- **rank** all replies from best to worst overall, as the person who asked would value them. No ties.
- **best_moves** — up to six concrete things the top replies did that weaker replies did not. Each must be specific enough to teach to another writer (name the move and quote or paraphrase where it appears, with the reply label).
- **common_failures** — up to six concrete weaknesses that appear in two or more replies, with labels.

Return only this JSON, no prose around it:

```json
{
  "case": "<case name>",
  "scores": { "<LABEL>": { "grounded": 0, "answers": 0, "decision": 0, "rigour": 0, "craft": 0, "economy": 0, "note": "<one sentence>" } },
  "rank": ["<best label>", "...", "<worst label>"],
  "best_moves": [ { "labels": ["<LABEL>"], "move": "<what they did>" } ],
  "common_failures": [ { "labels": ["<LABEL>"], "failure": "<what went wrong>" } ]
}
```
