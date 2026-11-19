---
name: options-with-do-nothing
tags: [strategy]
runs: 2
model: sonnet
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

Help me choose a direction. Everything I know is below; there is no more research to do today and nowhere to save files, so put the whole answer in your reply.

Situation
- I'm a solo developer with a personal knowledge assistant. It stores my notes, searches them, and answers questions with citations. I reach it through a chat app and through a connector that general AI assistants can plug into.
- What bothers me: in the chat app, long answers are hard to read, I can't see a note and the conversation side by side, and editing a note means retyping it.
- Last month I used it on 26 days out of 30. About one session in five was long (more than ten messages); those are the ones that hurt.
- A general AI assistant with my connector attached gives me a better reading experience today, but it only shows what the assistant vendor decides to show, and the connector feature is still marked as a preview.
- Building my own web interface: my estimate is 6 to 10 weekends for a first usable version, then upkeep for as long as I use it. Hosting would stay within the free tier I already have.
- Nobody else uses this. I'm not planning to sell it.

Which way should I go?
