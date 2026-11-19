# work-plugins

Personal, reusable plugins for coding agents. The repository is a Claude Code marketplace named `hdang-plugins`; the skills inside follow the open `SKILL.md` standard, so other tools can read them too.

| Plugin | What it does |
| --- | --- |
| [pm-research](plugins/pm-research/README.md) | Deep product and competitor research with a product manager's discipline: evidence ledger, verified claims, options, plans, a memory that learns from its mistakes, and working-style rules that follow the owner from project to project |

## Use in Claude Code

Add the marketplace and enable the plugin in a project's `.claude/settings.local.json` (the path is specific to one machine, so keep it out of committed settings):

```json
{
  "extraKnownMarketplaces": {
    "hdang-plugins": { "source": { "source": "directory", "path": "/absolute/path/to/work-plugins" } }
  },
  "enabledPlugins": { "pm-research@hdang-plugins": true }
}
```

If Claude Code then reports that the plugin is not installed, run `claude plugin install pm-research@hdang-plugins --scope local` once.

A marketplace added from a local folder is loaded in place: an edit to a skill is live at the next session start or after `/reload-plugins`, whatever the version says.

To try a plugin without touching any settings: `claude --plugin-dir /absolute/path/to/work-plugins/plugins/pm-research`.

## Use in other tools

```
node scripts/link-skills.mjs                       # link the skills into ~/.agents/skills
node scripts/link-skills.mjs --to <skills dir>     # or into the folder your tool reads
node scripts/link-skills.mjs --bin ~/.local/bin    # also put the pmr command on PATH
node scripts/link-skills.mjs --remove              # undo
```

The links point back into this repository. The script never replaces or removes anything that is not a link into this repository. Hooks are Claude Code only; elsewhere the skills and the `pmr` command still work.

## Checks

```
cd plugins/pm-research && npm test
claude plugin validate --strict . && claude plugin validate --strict plugins/pm-research
```

## Licence

No licence has been chosen yet; until one is added, all rights are reserved by the owner.
