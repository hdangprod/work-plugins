---
name: plan-from-chosen-direction
tags: [planning]
runs: 2
model: sonnet
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

I have decided what to build next for my personal notes assistant and want a plan I can start on Saturday. There is nowhere to save files here, so put the whole plan in your reply.

The decision: a small read-only web page that shows what the assistant did recently and what is waiting for my approval.

What I know:
- For two weeks I logged every moment I wished I could see this outside the chat app. There were 7. In 5 of them I was on my phone. In 6 of the 7 the thing I wanted was the list of proposals waiting for approval; once it was the activity history.
- I'm the only user. I work on this on evenings and weekends and will give it at most 6 weekends.
- Hosting stays on the free tier I already have.
- Notes marked private must never appear on the page to anyone who is not signed in as me. I have not decided how sign-in will work.
- No editing and no approving from the page in the first version. Approving stays in chat.
- The assistant already records its actions and pending proposals in its database.
