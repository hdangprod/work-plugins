/**
 * Proposals to change the plugin itself. The plugin may write a proposal on its own; only the owner can approve one.
 * Approval is recorded by the UserPromptSubmit hook when the owner types `approve P-###` (it reads the real prompt,
 * which the agent cannot forge) or by `pmr proposal approve` from an interactive terminal.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertShareable, atomicWrite, ensureGlobal, fail, findProject, forgottenIds, isDate, list, nextId, oneLine, today } from './store.mjs';
import { loadLessons } from './lessons.mjs';

const STATUSES = ['pending', 'approved', 'rejected', 'applied', 'rolled-back'];
const dir = (env) => join(ensureGlobal(env), 'proposals');

function parse(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return { meta, body: m[2] };
}
const serialise = (p) => `---\n${Object.entries(p.meta).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${p.body}`;

export function loadProposals(env) {
  const d = dir(env);
  return readdirSync(d).filter((f) => /^P-\d{3}\.md$/.test(f)).sort().map((f) => parse(readFileSync(join(d, f), 'utf8'))).filter(Boolean);
}
function getProposal(env, id) { return loadProposals(env).find((p) => p.meta.id === id) ?? fail(`No proposal ${id}. See \`pmr proposal list\`.`); }
function save(env, p) { atomicWrite(join(dir(env), `${p.meta.id}.md`), serialise(p)); }

/** Used by the hook and the CLI. Returns the proposal, or throws when it is not waiting for a decision. */
export function decide(env, id, status) {
  const p = getProposal(env, id);
  if (p.meta.status !== 'pending') fail(`${id} is ${p.meta.status}, not pending.`);
  p.meta.status = status;
  p.meta[status] = today(env);
  save(env, p);
  return p;
}

export function proposalAdd({ pos, opt, cwd, env }) {
  const title = oneLine(opt.title === true ? '' : opt.title) || fail('Missing --title.');
  const lessons = list(opt.lessons);
  const targets = list(opt.targets);
  const expected = oneLine(opt.expect === true ? '' : opt.expect) || fail('Missing --expect: the measurable effect this change should have.');
  if (!lessons.length) fail('Missing --lessons: the lesson ids (L-###) that justify the change. A proposal without recorded evidence is an opinion.');
  if (!targets.length) fail('Missing --targets: plugin-relative paths the change touches, for example skills/deep-research/SKILL.md.');
  if (targets.some((t) => t.startsWith('/') || t.includes('..'))) fail('--targets are paths inside the plugin, relative to its root.');
  if (!isDate(opt['check-by']) || opt['check-by'] <= today(env)) fail('Missing --check-by: a future date (YYYY-MM-DD) on which to check whether the change worked.');
  const known = new Set(loadLessons(env).map((l) => l.id));
  const unknown = lessons.find((l) => !known.has(l));
  if (unknown) fail(`Lesson ${unknown} does not exist.`);
  const source = pos[0] ?? (opt.file && opt.file !== true ? opt.file : null);
  const body = readFileSync(source ? resolve(cwd, source) : 0, 'utf8').trim();
  if (!/```diff\n[\s\S]+?```/.test(body)) fail('The proposal body must contain the exact change as a fenced ```diff block, so the owner approves a concrete edit rather than an intention.');
  assertShareable(findProject(cwd), title, expected, body);
  const id = nextId('P', [...loadProposals(env).map((p) => p.meta.id), ...forgottenIds(ensureGlobal(env))]);
  save(env, { meta: { id, title, status: 'pending', created: today(env), lessons: lessons.join(', '), targets: targets.join(', '), expected_effect: expected, check_by: opt['check-by'] }, body: `\n${body}\n` });
  console.log(`wrote ${id} (pending). The owner approves it by typing: approve ${id}`);
}

export function proposalList({ opt, env }) {
  const rows = loadProposals(env).filter((p) => !opt.status || p.meta.status === opt.status);
  if (!rows.length) { console.log('no proposals'); return; }
  for (const p of rows) console.log(`${p.meta.id} [${p.meta.status}] ${p.meta.title} · targets: ${p.meta.targets} · check by ${p.meta.check_by}`);
}

export function proposalShow({ pos, env }) { console.log(serialise(getProposal(env, pos[0]))); }

export function proposalApprove({ pos, env }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) fail(`Only the owner approves proposals. Ask them to type \`approve ${pos[0] ?? 'P-###'}\` in the chat, or to run this command in their own terminal.`);
  const p = decide(env, pos[0], 'approved');
  console.log(`${p.meta.id} approved`);
}

export function proposalReject({ pos, opt, env }) {
  const p = decide(env, pos[0], 'rejected');
  p.meta.note = oneLine(opt.note === true ? '' : opt.note) || 'no reason given';
  save(env, p);
  console.log(`${p.meta.id} rejected`);
}

function move(env, id, from, to, note) {
  const p = getProposal(env, id);
  if (p.meta.status !== from) fail(`${id} is ${p.meta.status}; this step needs a proposal that is ${from}.`);
  p.meta.status = to;
  p.meta[to] = today(env);
  p.meta[`${to}_note`] = oneLine(note === true ? '' : note) || fail('Give --note: the commit or branch, and what was observed.');
  save(env, p);
  console.log(`${id} ${to}`);
}
export function proposalApplied({ pos, opt, env }) { move(env, pos[0], 'approved', 'applied', opt.note); }
export function proposalRollback({ pos, opt, env }) { move(env, pos[0], 'applied', 'rolled-back', opt.note); }

/** Plugin-relative paths an approved, not yet applied proposal may change. */
export function approvedTargets(env) {
  const out = new Set();
  for (const p of loadProposals(env)) if (p.meta.status === 'approved') { out.add('CHANGELOG.md'); for (const t of list(p.meta.targets)) out.add(t); }
  return out;
}
export { STATUSES };
