---
name: voice-of-customer
description: Use when the user asks what people love, hate, complain about or wish for, why they switch between products, or wants reviews, comments, forum threads or app-store ratings read and summarised, including when the comments are pasted into the message. It groups what real users say into themes counted by person and source, keeps how bad a problem is apart from evidence that anyone left over it, checks the vendor's replies against the timeline, says how far the sample carries, and ends with what to fix, what to keep and what to check next.
---

# Voice of customer

Users are experts on their own problems and unreliable about solutions. Collect what they did and felt, in their own words; treat what they ask for as a clue to the need behind it.

## Before you start
1. `pmr recall --skill voice-of-customer --topic "<product or problem>"`.
2. Size the work. Comments supplied in the message: read them and answer in the reply. Comments still to be collected: `pmr run status <topic>` (no run: use `research-plan`), then copy `templates/voc.md` from this skill's folder to `voc.md` in the run's work directory.

## Reading the comments
1. **Sort out who is speaking.** Count people, not comments. Set aside vendor staff, the author's own replies and anything about another product. A staff statement ("most users never see this") is the vendor's voice, not a finding, and advice from support is not a user's workaround.
2. **Code each comment** with one main label: *pain*, *delight*, *workaround*, *request*, *switch-from*, *switch-to*, *confusion*. A workaround a user built is the strongest signal: they needed it enough to make it.
3. **Group into themes named as a user would say them** ("I can't find things I saved"), not as features ("search"). For each theme: people, independent sources, date range, and the one or two most telling quotes. Note who appears in more than one theme; three voices across four themes are still three people.
4. **Rank, keeping three things apart**: how bad it is when it happens (blocks the job, slows it, annoys), how many people report it, and whether anyone left or paid less because of it. A severe pain with no sign of leaving is not yet a finding about churn.
5. **Check the timeline.** Set the dates of complaints against releases and against what the vendor says was fixed. A complaint that continues after the "fix" is a finding; so is one that stops.
6. **Trace each request to the need behind it.** A cause or mechanism that rests on one person's account is an inference; mark it.
7. **Collect delight as carefully as pain.** It shows what must not be broken.
8. **Say how far the sample carries**: who is missing (silent satisfied users, people who never tried, people who left without writing), and what the owner could look up in their own data to settle each open point.
9. **End with the so-what**: what to fix first and how, specifically; what to keep; what to check next.

## Two lenses, when the sample supports them
- Switching stories from several people: the four forces (push, pull, anxiety, habit).
- Enough talk about features to tell them apart: a Kano reading (must-be, performance, attractive, indifferent).

Both are described in `references/voc-method.md`. With a handful of comments, think with them and print neither.

## Answering in the reply
What matters most and what to do about it come first. Then the themes, strongest first, each with its count of people and one quote; what is working; what the sample cannot tell; the next check.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Collecting the comments (a run)
1. **Choose at least three kinds of source and say what each over-represents**: store reviews (the extremes), forums (power users), issue trackers (technical users), social posts (the loud), "alternative to" threads (people who left).
2. **Collect verbatim** with `web-scout` agents, one per source kind, each asked for 15–25 dated quotes: recent ones first, low and high ratings both, and switching stories specifically. Record with `pmr evidence import` at tier `community`. Keep quotes in the original language.
3. **Register a claim for each theme you will use** (`kind: inference`, citing every supporting row) and verify it with the `claim-verifier` agent. A theme is `supported` only if the quotes really say it.
4. **Write** `voc.md`, leaving out a section the sample cannot fill, then `pmr lint <topic>`.

## Quality bar
- Every theme shows its count and source mix: "4 people, 2 independent sources, within the last 8 months".
- Wording matches the evidence: "several reviewers", "a recurring complaint in the forum", never "users hate" or "most users".
- Nothing is stated that the comments do not say.

## Never
- Never invent, tidy or translate a quote inside quotation marks.
- Never include personal details of a reviewer beyond what the claim needs; cite the page, not the person.
- Never count the same complaint cross-posted in three places as three sources.
- Never report prevalence ("40% of users") from a self-selected sample.
