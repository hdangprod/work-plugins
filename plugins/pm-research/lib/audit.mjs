/**
 * Memory control: what needs attention (audit), the fuller dashboard the retro skill reads (retro), per-domain
 * source track record, and forgetting. Forgetting removes the content and leaves only the id, so ids are never reused.
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { atomicWrite, clip, daysBetween, ensureGlobal, fail, findProject, gpath, listRuns, loadRun, oneLine, readJson, readJsonl, recordForgotten, requireProject, runDir, today, writeJsonl } from './store.mjs';
import { MAX_BYTES, MAX_LESSONS, loadLessons, staleNotes } from './lessons.mjs';
import { calibration, loadPredictions } from './calibration.mjs';
import { loadProposals } from './proposals.mjs';
import { observedNote } from './profile.mjs';
import { claimsFile, evidenceFile, ledgerStats } from './ledger.mjs';

function review(env, project) {
  const now = today(env);
  const lessons = loadLessons(env);
  const usage = readJson(gpath('usage.json', env), {});
  const bytes = existsSync(gpath('lessons.md', env)) ? Buffer.byteLength(readFileSync(gpath('lessons.md', env), 'utf8')) : 0;
  const mistakes = readJsonl(gpath('mistakes.jsonl', env));
  const proposals = loadProposals(env);
  const predictions = loadPredictions(env);
  const items = [];
  if (lessons.length > MAX_LESSONS * 0.8 || bytes > MAX_BYTES * 0.8) items.push(`lesson budget is nearly used (${lessons.length}/${MAX_LESSONS} lessons, ${bytes}/${MAX_BYTES} bytes): merge or retire some`);
  const promote = lessons.filter((l) => l.hits >= 2 && l.enforcedBy === 'none');
  for (const l of promote) items.push(`${l.id} recurred ×${l.hits} with nothing enforcing it: write a proposal (research-retro) — ${clip(l.rule, 80)}`);
  for (const l of lessons) {
    const age = daysBetween(l.first, now);
    if (!usage[l.id] && age > 60) items.push(`${l.id} was never recalled in ${age} days: retire it or fix its skill tag — ${clip(l.rule, 70)}`);
    else if (l.status === 'candidate' && age > 90) items.push(`${l.id} is still an unconfirmed candidate after ${age} days: confirm or retire it`);
  }
  const observed = observedNote(env);
  if (observed) items.push(observed);
  const loose = mistakes.filter((m) => !m.lesson);
  if (loose.length) items.push(`mistake(s) with no lesson: ${loose.map((m) => m.id).join(', ')}`);
  const due = predictions.filter((p) => !p.outcome && p.due <= now);
  if (due.length) items.push(`prediction(s) due for resolution: ${due.map((p) => p.id).join(', ')} (\`pmr predict resolve\`)`);
  for (const p of proposals) {
    if (p.meta.status === 'pending') items.push(`${p.meta.id} is waiting for the owner's decision: ${clip(p.meta.title, 70)}`);
    if (p.meta.status === 'approved') items.push(`${p.meta.id} is approved but not applied`);
    if (p.meta.status === 'applied' && p.meta.check_by <= now) items.push(`${p.meta.id} reached its check date (${p.meta.check_by}): did "${clip(p.meta.expected_effect, 60)}" happen? If not, roll it back`);
  }
  const weak = readJsonl(gpath('sources.jsonl', env)).filter((s) => s.refuted >= 2 && s.refuted >= s.supported);
  for (const s of weak) items.push(`claims resting on ${s.domain} failed verification ${s.refuted} time(s) against ${s.supported} supported: treat it as low reliability`);
  const runs = [];
  if (project) {
    for (const note of staleNotes(project, env)) items.push(`${note.file} passed its refresh date (${note.due}): re-verify before relying on it`);
    for (const run of listRuns(project)) {
      const stats = ledgerStats(project, run.topic);
      runs.push({ run, stats });
      if (run.status !== 'open') continue;
      const age = daysBetween(run.created, now);
      if (age > 14) items.push(`run ${run.topic} has been open for ${age} days: finish it, or close it with what is known`);
      if (stats.byStatus.unverified) items.push(`run ${run.topic}: ${stats.byStatus.unverified} unverified claim(s)`);
      if (stats.unusedEvidence.length > 5) items.push(`run ${run.topic}: ${stats.unusedEvidence.length} evidence rows are cited by no claim (searching beyond the brief?)`);
    }
  }
  return { items, lessons, promote, mistakes, proposals, predictions, usage, bytes, runs };
}

export function audit({ cwd, env }) {
  const { items } = review(env, findProject(cwd));
  if (!items.length) { console.log('audit clean'); return; }
  for (const item of items) console.log(`- ${item}`);
  console.log(`audit: ${items.length} item(s) need attention`);
}

export function retro({ cwd, env }) {
  const project = findProject(cwd);
  const r = review(env, project);
  const count = (rows, key) => Object.entries(rows.reduce((acc, row) => { const k = row[key] ?? 'unknown'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
  console.log(`Lessons: ${r.lessons.length}/${MAX_LESSONS} (${r.bytes}/${MAX_BYTES} bytes) · ${count(r.lessons, 'status')}`);
  console.log(`Mistakes: ${r.mistakes.length} · by skill: ${count(r.mistakes, 'skill')} · by who caught it: ${count(r.mistakes, 'source')}`);
  if (r.promote.length) { console.log('Promotion candidates (recurring, not enforced):'); for (const l of r.promote) console.log(`  ${l.id} ×${l.hits} [${l.skill}] ${l.trigger} → ${l.rule}`); }
  const c = calibration(env);
  console.log(c.n ? `Calibration: ${c.n} resolved, Brier ${c.brier.toFixed(3)}, stated ${Math.round(c.stated * 100)}% vs actual ${Math.round(c.actual * 100)}%` : `Calibration: no resolved predictions (${r.predictions.length} open)`);
  console.log(`Proposals: ${count(r.proposals.map((p) => p.meta), 'status')}`);
  if (r.runs.length) {
    console.log('Verification failure rate by run (falling over time means the research is improving):');
    for (const { run, stats } of r.runs) console.log(`  ${run.created} ${run.topic} [${run.status}]: ${stats.failRate === null ? 'nothing verified' : `${Math.round(stats.failRate * 100)}% of ${stats.checked} checked claims failed`} · ${stats.evidence} evidence, ${stats.claims} claims`);
  }
  console.log(r.items.length ? `Needs attention:\n${r.items.map((i) => `- ${i}`).join('\n')}` : 'Nothing else needs attention.');
}

export function sources({ env }) {
  const rows = readJsonl(gpath('sources.jsonl', env));
  if (!rows.length) { console.log('no source track record yet'); return; }
  for (const s of rows) console.log(`${s.domain} [${s.tier}] supported ${s.supported}, partial ${s.partial}, refuted ${s.refuted}, unreachable ${s.unreachable}${s.note ? ` — ${s.note}` : ''}`);
}

export function sourceNote({ pos, opt, env }) {
  const domain = pos[0] ?? fail('Usage: pmr source note <domain> --note "…"');
  const note = oneLine(opt.note === true ? '' : opt.note) || fail('Missing --note.');
  ensureGlobal(env);
  const file = gpath('sources.jsonl', env);
  const rows = readJsonl(file);
  let row = rows.find((r) => r.domain === domain);
  if (!row) { row = { domain, tier: opt.tier && opt.tier !== true ? opt.tier : 'third', supported: 0, partial: 0, refuted: 0, unreachable: 0 }; rows.push(row); }
  row.note = clip(note, 160);
  row.updated = today(env);
  writeJsonl(file, rows.sort((a, b) => a.domain.localeCompare(b.domain)));
  console.log(`noted ${domain}`);
}

export function forget({ pos, opt, cwd, env }) {
  const id = String(pos[0] ?? '');
  const home = ensureGlobal(env);
  const dropRow = (file, dir) => {
    const rows = readJsonl(file);
    if (!rows.some((r) => r.id === id)) fail(`Nothing with id ${id} found.`);
    writeJsonl(file, rows.filter((r) => r.id !== id));
    recordForgotten(dir, id, env);
  };
  if (/^L-\d+$/.test(id)) {
    const file = gpath('lessons.md', env);
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const kept = text.split('\n').filter((line) => !line.startsWith(`- ${id} `));
    if (kept.length === text.split('\n').length) fail(`Nothing with id ${id} found.`);
    atomicWrite(file, kept.join('\n'));
    const usage = readJson(gpath('usage.json', env), {});
    delete usage[id];
    atomicWrite(gpath('usage.json', env), `${JSON.stringify(usage, null, 2)}\n`);
    recordForgotten(home, id, env);
  } else if (/^M-\d+$/.test(id)) dropRow(gpath('mistakes.jsonl', env), home);
  else if (/^PR-\d+$/.test(id)) dropRow(gpath('calibration.jsonl', env), home);
  else if (/^W-\d+$/.test(id)) dropRow(gpath('profile.jsonl', env), home);
  else if (/^P-\d+$/.test(id)) {
    const file = join(home, 'proposals', `${id}.md`);
    if (!existsSync(file)) fail(`Nothing with id ${id} found.`);
    rmSync(file);
    recordForgotten(home, id, env);
  } else if (/^[EC]-\d+$/.test(id)) {
    const project = requireProject(cwd);
    const topic = opt.topic && opt.topic !== true ? opt.topic : fail(`${id} belongs to a research run: pass --topic <topic>.`);
    loadRun(project, topic);
    if (id.startsWith('E')) {
      const citing = readJsonl(claimsFile(project, topic)).filter((c) => c.sources.includes(id)).map((c) => c.id);
      if (citing.length) fail(`${id} is cited by ${citing.join(', ')}. Forget those claims first, or keep the evidence.`);
      dropRow(evidenceFile(project, topic), runDir(project, topic));
    } else dropRow(claimsFile(project, topic), runDir(project, topic));
  } else fail('Usage: pmr forget <L-### | M-### | PR-### | P-### | W-### | E-### --topic t | C-### --topic t>');
  console.log(`forgot ${id}`);
}
