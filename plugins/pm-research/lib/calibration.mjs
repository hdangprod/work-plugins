/**
 * Prediction log. Every recommendation records what it expects to happen, with a probability and a due date.
 * Resolving predictions later shows whether stated confidence can be trusted, which is the only honest way to
 * tell whether the research is getting better.
 */
import { appendJsonl, assertShareable, ensureGlobal, fail, findProject, forgottenIds, gpath, isDate, nextId, oneLine, readJsonl, today, writeJsonl } from './store.mjs';

const file = (env) => gpath('calibration.jsonl', env);
export function loadPredictions(env) { return readJsonl(file(env)); }

export function predictAdd({ opt, cwd, env }) {
  const text = oneLine(opt.text === true ? '' : opt.text) || fail('Missing --text: a statement that will be plainly true or false on the due date.');
  const p = Number(opt.p);
  if (!(p > 0 && p < 1)) fail('--p is your probability that the statement turns out true, between 0 and 1 (for example 0.7).');
  if (!isDate(opt.due)) fail('--due is the date the statement can be judged, as YYYY-MM-DD.');
  if (opt.due <= today(env)) fail('--due must be in the future.');
  const project = findProject(cwd);
  assertShareable(project, text);
  const home = ensureGlobal(env);
  const id = nextId('PR', [...loadPredictions(env).map((r) => r.id), ...forgottenIds(home)]);
  appendJsonl(file(env), { id, text, p, due: opt.due, made: today(env), project: project?.name ?? null, topic: opt.topic && opt.topic !== true ? opt.topic : null, outcome: null, resolved: null, note: null });
  console.log(`recorded ${id} (${Math.round(p * 100)}% by ${opt.due})`);
}

export function predictResolve({ pos, opt, env }) {
  const rows = loadPredictions(env);
  const row = rows.find((r) => r.id === pos[0]) ?? fail(`No prediction ${pos[0]}. See \`pmr predict list\`.`);
  if (!['true', 'false', 'void'].includes(opt.outcome)) fail('--outcome is true, false, or void (the question stopped making sense).');
  row.outcome = opt.outcome;
  row.resolved = today(env);
  row.note = oneLine(opt.note === true ? '' : opt.note) || null;
  writeJsonl(file(env), rows);
  console.log(`${row.id} resolved ${row.outcome}`);
}

export function predictList({ opt, env }) {
  const now = today(env);
  const rows = loadPredictions(env).filter((r) => (!opt.open || !r.outcome) && (!opt.due || (!r.outcome && r.due <= now)) && (!opt.topic || r.topic === opt.topic));
  if (!rows.length) { console.log('no predictions'); return; }
  for (const r of rows) console.log(`${r.id} ${Math.round(r.p * 100)}% by ${r.due} [${r.outcome ?? (r.due <= now ? 'DUE' : 'open')}] ${r.text}${r.topic ? ` (${r.topic})` : ''}`);
}

export function calibration(env) {
  const resolved = loadPredictions(env).filter((r) => r.outcome === 'true' || r.outcome === 'false');
  const buckets = new Map();
  let brier = 0;
  for (const r of resolved) {
    const hit = r.outcome === 'true' ? 1 : 0;
    brier += (r.p - hit) ** 2;
    const low = Math.min(90, Math.floor(r.p * 10) * 10);
    const b = buckets.get(low) ?? { low, n: 0, hits: 0, sum: 0 };
    b.n += 1; b.hits += hit; b.sum += r.p;
    buckets.set(low, b);
  }
  const stated = resolved.length ? resolved.reduce((s, r) => s + r.p, 0) / resolved.length : null;
  const actual = resolved.length ? resolved.filter((r) => r.outcome === 'true').length / resolved.length : null;
  return { n: resolved.length, brier: resolved.length ? brier / resolved.length : null, stated, actual, buckets: [...buckets.values()].sort((a, b) => a.low - b.low) };
}

export function predictReport({ env }) {
  const c = calibration(env);
  if (!c.n) { console.log('no resolved predictions yet'); return; }
  console.log(`${c.n} resolved · Brier ${c.brier.toFixed(3)} (0 is perfect, 0.25 is a coin flip)`);
  for (const b of c.buckets) console.log(`  said ${b.low}–${b.low + 9}%: ${b.hits}/${b.n} came true (${Math.round((b.hits / b.n) * 100)}%)`);
  if (c.n >= 10) {
    const gap = c.stated - c.actual;
    console.log(Math.abs(gap) < 0.1 ? 'Stated confidence roughly matches outcomes.' : gap > 0 ? `Overconfident: average stated ${Math.round(c.stated * 100)}%, actual ${Math.round(c.actual * 100)}%. Lower stated confidence.` : `Underconfident: average stated ${Math.round(c.stated * 100)}%, actual ${Math.round(c.actual * 100)}%.`);
  } else console.log('Too few resolved predictions to judge calibration (need 10).');
}
