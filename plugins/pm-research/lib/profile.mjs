/**
 * How the owner works, in two tiers, so the same plugin fits several projects without hard-coding either.
 * Shared tier: `profile.jsonl` in the global home, one working-style rule per row. A rule the agent inferred is
 * `observed` (a default to check); it becomes `confirmed` only on the owner's own words.
 * Project tier: the file named by `context_file` in `.pm-research.json`, written and edited by the owner in the project.
 * Where the two disagree, the project file wins.
 */
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { assertShareable, clip, ensureGlobal, fail, findProject, forgottenIds, gpath, nextId, oneLine, readJsonl, similarity, today, writeJsonl } from './store.mjs';

export const MAX_RULES = 24;
const MAX_RULE_CHARS = 160;
const CONTEXT_LINES = 40;
const SOURCES = ['owner', 'self'];

const file = (env) => gpath('profile.jsonl', env);
function loadProfile(env) { return readJsonl(file(env)); }
const show = (r) => `${r.id} [${r.status}, ${r.area}] ${r.rule}`;
function getRule(rows, id) { return rows.find((r) => r.id === id) ?? fail(`No working-style rule ${id}. See \`pmr profile list\`.`); }
function area(value) {
  const text = oneLine(value === true ? '' : value);
  if (!/^[a-z][a-z-]{1,23}$/.test(text)) fail('--area is one short kebab-case word for where the rule applies, for example reporting, decisions, evidence, planning or collaboration.');
  return text;
}
function rule(value) {
  const text = oneLine(value === true ? '' : value);
  if (!text) fail('Missing --rule: one sentence on how the owner wants the work done.');
  if (text.length > MAX_RULE_CHARS) fail(`--rule is ${text.length} characters; a working-style rule is one line (max ${MAX_RULE_CHARS}).`);
  return text;
}

export function profileAdd({ opt, cwd, env }) {
  const row = { area: area(opt.area), rule: rule(opt.rule) };
  const source = opt.source ?? 'self';
  if (!SOURCES.includes(source)) fail(`--source is ${SOURCES.join(' or ')}: owner when the owner said it in their own words, self when you inferred it.`);
  assertShareable(findProject(cwd), row.rule);
  const rows = loadProfile(env);
  const twin = rows.find((r) => similarity(r.rule, row.rule) >= 0.5);
  if (twin && !opt.force) fail(`This looks like ${twin.id} ("${clip(twin.rule, 80)}"). Change it with \`pmr profile set ${twin.id}\`, or pass --force if it really is a different rule.`);
  if (rows.length >= MAX_RULES) fail(`Profile budget reached (${MAX_RULES} rules). Merge or forget one first: a profile that is not short stops being applied.`);
  const home = ensureGlobal(env);
  const added = { id: nextId('W', [...rows.map((r) => r.id), ...forgottenIds(home)]), ...row, status: source === 'owner' ? 'confirmed' : 'observed', first: today(env), updated: today(env) };
  writeJsonl(file(env), [...rows, added]);
  console.log(`added ${added.id} (${added.status})`);
}

export function profileConfirm({ pos, env }) {
  const rows = loadProfile(env);
  const row = getRule(rows, pos[0]);
  row.status = 'confirmed';
  row.updated = today(env);
  writeJsonl(file(env), rows);
  console.log(show(row));
}

export function profileSet({ pos, opt, cwd, env }) {
  const rows = loadProfile(env);
  const row = getRule(rows, pos[0]);
  if (!opt.rule && !opt.area) fail('Nothing to change: pass --rule and/or --area. To remove a rule use `pmr forget W-###`.');
  if (opt.rule) row.rule = rule(opt.rule);
  if (opt.area) row.area = area(opt.area);
  assertShareable(findProject(cwd), row.rule);
  row.updated = today(env);
  writeJsonl(file(env), rows);
  console.log(show(row));
}

export function profileList({ opt, env }) {
  const rows = loadProfile(env).filter((r) => (!opt.area || r.area === opt.area) && (!opt.status || r.status === opt.status));
  if (!rows.length) { console.log('no working-style rules'); return; }
  for (const r of rows) console.log(show(r));
}

/** Guesses must not pile up: the session brief and the audit both ask for these to be put to the owner. */
export function observedNote(env) {
  const ids = loadProfile(env).filter((r) => r.status === 'observed').map((r) => r.id);
  return ids.length ? `working-style rule(s) inferred and not yet confirmed: ${ids.join(', ')}. Ask the owner, then \`pmr profile confirm <W-id>\` or \`pmr forget <W-id>\`` : null;
}

/** What `pmr recall` prints ahead of the lessons: the shared rules, then the project's own context file. */
export function profileLines(project, env) {
  const lines = [];
  const rows = loadProfile(env);
  const pick = (status) => rows.filter((r) => r.status === status).map((r) => `- ${r.id} [${r.area}] ${r.rule}`);
  const confirmed = pick('confirmed'); const observed = pick('observed');
  if (confirmed.length) lines.push('How the owner works (confirmed by the owner; follow these):', ...confirmed);
  if (observed.length) lines.push('Observed, not yet confirmed (use as defaults; ask the owner when one matters to the outcome):', ...observed);
  if (project?.contextFile) {
    const name = relative(project.root, project.contextFile);
    if (!existsSync(project.contextFile)) lines.push(`Project context file ${name} is named in the config but does not exist yet.`);
    else {
      const text = readFileSync(project.contextFile, 'utf8').trim().split('\n');
      lines.push(`Project context (${name}; it overrides the shared rules above where they disagree):`, ...text.slice(0, CONTEXT_LINES));
      if (text.length > CONTEXT_LINES) lines.push(`… ${text.length - CONTEXT_LINES} more lines in ${name}; keep that file under ${CONTEXT_LINES} lines so all of it is read every time.`);
    }
  }
  return lines;
}
