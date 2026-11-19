---
name: market-map
description: Use when the user asks who the competitors or alternatives are, how a market is structured, where the gaps are, whether there is room for their own thing, or which products are worth studying in depth, including when their notes on the products are pasted into the message. It defines the market by the job, covers direct, indirect and substitute alternatives and doing nothing, picks the two axes people really choose on, tests each gap against the reasons it might be empty, fits the advice to what the owner's product is for, and ends with a shortlist or one cheap next step.
---

# Market map

A map is a tool for choosing where to look closely and where to stand. Its value is in what it leaves out and in the axes it picks.

## Before you start
1. `pmr recall --skill market-map --topic "<category and job>"`.
2. Size the work. Notes on the products supplied in the message: use the steps below for the thinking and answer in the reply. Otherwise `pmr run status <topic>` (no run: use `research-plan`), then copy `templates/market-map.md` from this skill's folder to `market-map.md` in the run's work directory.

## Steps
1. **Define the market by the job, not the category.** "People who need to find their own past notes quickly" is a market. "AI note apps" is a category label that hides half the competition.
2. **List alternatives of four kinds** (aim for 10–20 names before cutting):
   - *direct*: same job, same approach;
   - *indirect*: same job, different approach;
   - *substitute*: a general tool bent to the job (spreadsheet, chat app, email to self, a folder of files);
   - *non-consumption*: doing it by hand or not at all.
   Find names from "alternative to" and "vs" searches, marketplace and app-store categories, comparison posts written by users, and what people in forums say they switched from.
3. **Collect the same facts for each** with `deep-research` steps 1–3: who it is for, the one-line promise, price band, platform and openness, a rough traction signal with its source and year, and the one thing it is known for. One scout can cover three or four products at this depth. Facts go into the ledger; cells in the table cite claim ids.
4. **Segment the users.** Three to five segments distinguished by situation and need, not by demographics. For each: the job, what they use today, what they will pay, what they cannot tolerate.
5. **Choose two axes that buyers actually decide on.** Derive them from user voice (what people compare on when they switch), not from what is convenient to plot. Avoid axes where everyone clusters, and avoid "good/bad" axes. Typical useful pairs: simple ↔ powerful, closed ↔ open, individual ↔ team, automatic ↔ manual control, cheap ↔ premium.
6. **Place every alternative** and write one sentence justifying each position with evidence.
7. **Find the white space, then distrust it.** An empty region means one of three things: nobody wants it, it cannot be built or paid for, or it is a real opening. Commit to the one you believe and say what evidence separates the three.
8. **Note movement.** Who is moving where (recent launches, pricing changes, acquisitions), and which positions are getting crowded.
9. **Shortlist 2–4 products for teardown**: the leader in the segment we care about, the nearest to where we might stand, and the one with the most interesting different approach. Say why each, and why the rest are left out.
10. For a run: `pmr lint <topic>`, then continue with `competitor-teardown` for the shortlist.

Method detail: `references/market-method.md`.

## Answering in the reply
- Two lines first: whether there is room, and for which use.
- **Fit the advice to what the owner's thing is for.** A tool built for their own use and not for sale gets no pricing, positioning or go-to-market advice; the question becomes what to borrow, what to skip and whether to build at all.
- One compact table of the alternatives, substitutes and doing nothing included. Name the kind of alternative their notes leave out.
- **Check each number against the owner's own product before using it.** A statistic about people who use several tools says little about a tool that only searches its own notes.
- The gap, the reason you believe it is empty, and one cheap step that would test that belief.

**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: `../pm/references/reply.md`.

## Quality bar
- The map names at least one substitute and addresses non-consumption explicitly.
- Every number has a unit, a year and a source. No market-size figure without its method; if only top-down estimates exist, say so and give a bottom-up cross-check or none at all.
- Axes come from how buyers choose, stated with evidence.
- Each white-space claim says why it might be empty for a good reason.
- The shortlist is short.

## Never
- Never present a 20-row feature matrix as a market map.
- Never treat funding or press coverage as proof of user value.
- Never place a product on the map from its marketing alone when user voice is available.
