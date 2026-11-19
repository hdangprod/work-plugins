---
name: challenge-before-commit
tags: [review]
runs: 2
model: sonnet
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill]
---

Before I commit to this, tell me what is wrong with it. Be direct. There is nowhere to save files here, so put everything in your reply.

Memo: build my own web interface for my notes assistant

1. Why: the chat app is cramped. Last month I used the assistant on 26 days, 130 sessions in total. 22 of those were long sessions (more than ten messages), so about half my use is painful.
2. Evidence it's worth it: I asked in a forum thread, "Did anyone build their own interface for their notes tool, and was it worth it?" Eleven people answered and nine said yes.
3. Options I considered: (a) a full web app with editor, search and chat; (b) the same without the editor.
4. I have already spent three weekends on a prototype of (a), so stopping now would throw that away.
5. Cost: hosting fits in my free tier, so the cost is zero.
6. Plan: eight more weekends to a first version. I'll know it worked if using it feels better.
7. Risk: none worth listing. The general AI assistant I could use instead only has connectors in preview, which is one more reason to build.
