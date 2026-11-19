#!/usr/bin/env node
/**
 * Makes the pm-research skills visible to tools that read the open SKILL.md standard from a shared skills folder
 * (Codex, Antigravity, OpenCode and others), and optionally puts `pmr` on PATH for them.
 *
 *   node scripts/link-skills.mjs                      link every skill into ~/.agents/skills
 *   node scripts/link-skills.mjs --to <dir>           link into another skills folder
 *   node scripts/link-skills.mjs --bin ~/.local/bin   also link the pmr command there
 *   node scripts/link-skills.mjs --prefix pm-research-  name the links <prefix><skill> (see the note below)
 *   node scripts/link-skills.mjs --remove             remove the links this script made
 *   node scripts/link-skills.mjs --dry-run            print what would change
 *
 * Links are symlinks back into this repository, so an approved change to a skill is live everywhere at once.
 * By default a link carries the skill's own name, because the open standard expects the folder name to equal the
 * `name` in SKILL.md. Use --prefix only for a tool that accepts a differing folder name and has a clashing skill.
 * Nothing that is not a link into this repository is ever replaced or removed.
 */
import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = join(REPO, 'plugins', 'pm-research');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const expand = (p) => resolve(p.replace(/^~(?=$|\/)/, homedir()));

if (flag('help')) { console.log('usage: node scripts/link-skills.mjs [--to <skills dir>] [--bin <dir on PATH>] [--prefix <text>] [--remove] [--dry-run]'); process.exit(0); }

const target = expand(value('to') ?? '~/.agents/skills');
const binDir = value('bin') ? expand(value('bin')) : null;
const prefix = value('prefix') ?? '';
const dry = flag('dry-run');
const remove = flag('remove');

const isLink = (path) => { try { return lstatSync(path).isSymbolicLink(); } catch { return false; } };
const present = (path) => { try { lstatSync(path); return true; } catch { return false; } };
const ours = (path) => isLink(path) && resolve(dirname(path), readlinkSync(path)).startsWith(`${REPO}/`);

let changed = 0; let skipped = 0;
function link(from, to) {
  if (present(to) && !ours(to)) { console.log(`skip    ${to} (exists and is not a link into this repository)`); skipped += 1; return; }
  if (ours(to) && resolve(dirname(to), readlinkSync(to)) === from) { console.log(`ok      ${to}`); return; }
  console.log(`link    ${to} -> ${from}`);
  changed += 1;
  if (dry) return;
  mkdirSync(dirname(to), { recursive: true });
  if (present(to)) rmSync(to);
  symlinkSync(from, to);
}
function unlink(to) {
  if (!ours(to)) return;
  console.log(`remove  ${to}`);
  changed += 1;
  if (!dry) rmSync(to);
}

const skills = readdirSync(join(PLUGIN, 'skills')).filter((name) => existsSync(join(PLUGIN, 'skills', name, 'SKILL.md'))).sort();
for (const name of skills) {
  const to = join(target, `${prefix}${name}`);
  if (remove) unlink(to); else link(join(PLUGIN, 'skills', name), to);
}
if (binDir) { const to = join(binDir, 'pmr'); if (remove) unlink(to); else link(join(PLUGIN, 'bin', 'pmr'), to); }

console.log(`${dry ? 'would change' : 'changed'} ${changed}, skipped ${skipped}, skills ${skills.length}, folder ${target}`);
if (!remove && !binDir) console.log(`pmr is not on PATH for these tools. Either rerun with --bin <dir on PATH>, or call: node ${join(PLUGIN, 'bin', 'pmr')}`);
if (!remove) console.log('Hooks (session brief, lint on write, approval, guard) are Claude Code only. In other tools the skills still work; run `pmr lint <topic>` and `pmr run status` yourself.');
