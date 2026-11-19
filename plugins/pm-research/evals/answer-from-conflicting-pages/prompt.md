---
name: answer-from-conflicting-pages
tags: [research]
runs: 2
model: sonnet
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

I saved five pages about an AI assistant called Loomwell, because I want to plug my own notes server into it. I can't give you web access here and there is nowhere to save files, so work only from these pages and put the whole answer in your reply.

Research these three questions for me:
1. Can I connect my own custom connector to Loomwell today, and on which plan?
2. What would that cost me a month? I'm one person.
3. Does it keep a memory of me that I can look through and delete item by item?

=== Page 1: https://help.loomwell.example.com/connectors (vendor help centre, article updated 2026-09-14) ===
Connectors let Loomwell work with your other tools.
Built-in connectors: calendar, mail and drive. Available on Plus, Pro and Team.
Custom connectors: add any remote server that speaks the open connector protocol. Available on Pro and Team. Custom connectors are in beta and may change.

=== Page 2: https://loomwell.example.com/pricing (vendor pricing page, saved 2026-10-01) ===
Free — USD 0. Chat, 20 messages a day.
Plus — USD 8 a month. Built-in connectors, memory.
Pro — USD 20 a month billed yearly, or USD 25 billed monthly. Everything in Plus, custom connectors (beta), priority access.
Team — USD 30 per seat a month, minimum 2 seats. Everything in Pro, shared workspaces, admin controls.

=== Page 3: https://gadgetdesk.example.org/loomwell-review (independent review site, published 2026-06-03) ===
Loomwell's best trick is connectors. Custom connectors are available on every paid plan, including the USD 8 Plus tier, which makes it the cheapest way to hook your own server to an assistant.
Memory is transparent: Settings > Memory lists everything it has learned about you, and you can delete entries one by one.

=== Page 4: https://loomwell.example.com/release-notes (vendor release notes, entry dated 2026-10-20) ===
Memory: we have replaced the memory list with automatic memory. Loomwell now learns in the background from your chats. You can turn memory off, or reset it, in Settings. Editing individual memories is no longer available.
Connectors: custom connectors now require a server that is reachable from the public internet. Servers on localhost are not supported.

=== Page 5: https://forum.example.org/t/loomwell-custom-connectors/9120 (user forum thread, saved 2026-10-27) ===
hale (Oct 24): I'm on Plus and added a custom connector last week without trouble, so the pricing page is wrong.
orrin (Oct 25): Did you sign up before the summer? My Plus account is new and the custom connector button just shows an upgrade prompt.
hale (Oct 25): March, yes.
suvi (Oct 26): For one person Team makes no sense anyway, two seats minimum means USD 60.
orrin (Oct 26): Does anyone know if the memory reset also clears what connectors sent it? Support hasn't answered me.
