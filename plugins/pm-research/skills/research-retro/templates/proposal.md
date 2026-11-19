## Problem
<!-- What keeps going wrong, in general terms. No project names or private details. -->
TODO

## Evidence
<!-- Lesson ids with how many times each recurred, the mistake ids behind them, who caught them, and what it cost (rework, a wrong conclusion, the owner's time). -->
- TODO

## Why the current mechanism is not enough
<!-- Where the rule lives today (a lesson, a line in a skill) and why that did not prevent the repeat. -->
TODO

## Change
<!-- The exact edit against the plugin's files. One concern. Prefer a check that cannot be skipped over more prose. -->
```diff
--- a/skills/TODO/SKILL.md
+++ b/skills/TODO/SKILL.md
@@
-TODO old line
+TODO new line
```

## Expected effect
<!-- Observable and countable, for example "no claim refuted for this reason in the next three runs". -->
TODO

## How it will be checked
<!-- Which number or which eval, and on what date. -->
TODO

## Cost and risk
<!-- Added length, added steps or tokens per run, anything it might make worse. -->
TODO

## Rollback
<!-- How to undo it. -->
Revert the commit on the plugin repository and record `pmr proposal rollback`.
