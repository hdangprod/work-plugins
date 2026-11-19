/**
 * Structural checks on research artefacts. They enforce the habits the skills ask for: a dated header, citations that
 * resolve to the ledger, no refuted claim quoted as fact, at least three options including "do nothing", and a
 * recommendation that states its confidence and what would change it.
 * Structural labels stay in English in every project so these checks keep working when the prose is in another language.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { claimStatus, loadLedger } from './ledger.mjs';
import { fail, listRuns, loadRun, requireProject, runDir } from './store.mjs';

const uniq = (items) => [...new Set(items ?? [])];
function refsIn(text) { return { claims: uniq(text.match(/\bC-\d{3,}\b/g)), evidence: uniq(text.match(/\bE-\d{3,}\b/g)) }; }

/** Text under the first heading whose title matches, up to the next heading of the same or a higher level. */
export function section(text, titleRe) {
  const lines = text.split('\n');
  let start = -1; let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (!m) continue;
    if (start < 0) { if (titleRe.test(m[2])) { start = i; level = m[1].length; } continue; }
    if (m[1].length <= level) return lines.slice(start + 1, i).join('\n');
  }
  return start < 0 ? null : lines.slice(start + 1).join('\n');
}
function sections(text, titleRe) {
  const out = []; const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m && current && m[1].length <= current.level) { out.push(current); current = null; }
    if (m && !current && titleRe.test(m[2])) { current = { title: m[2], level: m[1].length, body: '' }; continue; }
    if (current) current.body += `${line}\n`;
  }
  if (current) out.push(current);
  return out;
}

function checkRecommendation(text, issues, required) {
  const rec = section(text, /^recommendation\b/i);
  if (rec === null) { if (required) issues.push('error: no `## Recommendation` section. Research serves a decision; if the evidence cannot settle it, say so there and name the next step'); return; }
  if (!/confidence:\s*\d{1,3}\s*%/i.test(rec)) issues.push('error: the recommendation has no `Confidence: NN%` line');
  if (!/change my mind/i.test(rec)) issues.push('error: the recommendation does not say what would change my mind');
}

function checkRefs(text, ledger, issues, strict) {
  if (!ledger) return;
  const { claims, evidence } = refsIn(text);
  for (const id of evidence) if (!ledger.evidenceById.has(id)) issues.push(`error: ${id} is cited but is not in the evidence ledger`);
  for (const id of claims) {
    const claim = ledger.claimsById.get(id);
    if (!claim) { issues.push(`error: ${id} is cited but is not in the claim register`); continue; }
    const status = claimStatus(claim);
    if (status === 'refuted') issues.push(`error: ${id} was refuted by verification and is still cited`);
    else if (status === 'unverified') issues.push(`${strict ? 'error' : 'warn'}: ${id} is cited but not verified yet`);
    else if (status === 'contested' && !/contradict|conflict|disagree/i.test(text)) issues.push(`error: ${id} is contested (sources disagree); show both sides under a contradictions heading instead of picking one`);
  }
}

const REQUIRED = {
  brief: [/^questions\b/i, /^hypotheses\b/i, /^source plan\b/i, /^stop rule\b/i, /^out of scope\b/i],
  plan: [/^outcome\b/i, /^non-goals\b/i, /^riskiest assumption\b/i, /^milestones\b/i, /^metrics\b/i, /^kill criteria\b/i],
  'after-action': [/^what went well\b/i, /^what went wrong\b/i, /^lessons\b/i, /^predictions\b/i],
};
const label = (re) => re.source.replace(/^\^/, '').replace(/\\b$/, '').replace(/\\/g, '');

export function lintText(kind, text, ledger, { strict = false } = {}) {
  const issues = [];
  checkRefs(text, ledger, issues, strict);
  if (strict && /\bTODO\b/.test(text)) issues.push('error: unfinished `TODO` markers remain');
  for (const re of REQUIRED[kind] ?? []) if (section(text, re) === null) issues.push(`error: missing section "${label(re)}"`);

  if (kind === 'brief' && !/^\*{0,2}Decision\*{0,2}:\s*\S/mi.test(text)) issues.push('error: the brief has no `Decision:` line. Name the decision this research serves before collecting anything');

  if (kind === 'report') {
    const head = text.split('\n').slice(0, 8).join('\n');
    const m = /^verified: (\d{4}-\d{2}-\d{2}) · refresh_after: (\d{4}-\d{2}-\d{2}) · method: \S/m.exec(head);
    if (!m) issues.push('error: no header line `verified: YYYY-MM-DD · refresh_after: YYYY-MM-DD · method: …` near the top');
    else if (m[2] <= m[1]) issues.push('error: refresh_after must be later than verified');
    if (!/^\*{0,2}Decision\*{0,2}:\s*\S/mi.test(text)) issues.push('error: no `Decision:` line saying which decision this report serves');
    if (section(text, /^open questions\b/i) === null) issues.push('error: no `## Open questions` section. Keep what is unknown apart from what is established');
    const sources = section(text, /^sources\b/i);
    if (sources === null) issues.push('error: no `## Sources` section');
    const cited = refsIn(text);
    if (ledger) {
      if (!cited.claims.length && !cited.evidence.length) issues.push('error: the report cites no claim or evidence id; every finding needs one');
      const needed = new Set(cited.evidence);
      for (const id of cited.claims) for (const s of ledger.claimsById.get(id)?.sources ?? []) needed.add(s);
      const missing = [...needed].filter((id) => { const e = ledger.evidenceById.get(id); return e && !(sources ?? '').includes(e.url); });
      if (sources !== null && missing.length) issues.push(`error: Sources does not list ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ` and ${missing.length - 6} more` : ''}. Paste the output of \`pmr report sources <topic>\``);
    }
    checkRecommendation(text, issues, true);
  }

  if (kind === 'options') {
    const options = sections(text, /^option\b/i);
    if (options.length < 3) issues.push(`error: ${options.length} option(s) found; give at least three that differ in kind, each under a heading that starts with "Option"`);
    if (!options.some((o) => /do nothing|status quo|not build|wait/i.test(o.title))) issues.push('error: no "do nothing" option. The status quo is always a competitor');
    for (const o of options) if (!/riskiest assumption:/i.test(o.body)) issues.push(`error: "${o.title}" has no \`Riskiest assumption:\` line`);
    if (section(text, /^pre-mortem\b/i) === null) issues.push('error: missing section "pre-mortem"');
    checkRecommendation(text, issues, true);
  }
  return issues;
}

/** Artefacts of a run: the published report plus every Markdown file in its work directory. */
function runFiles(project, run) {
  const dir = runDir(project, run.topic);
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)) : [];
  const report = resolve(project.root, run.report);
  if (existsSync(report)) files.push(report);
  return files;
}
function kindOf(project, run, file) {
  if (resolve(file) === resolve(project.root, run.report)) return 'report';
  const name = basename(file, '.md');
  return ['brief', 'options', 'plan', 'after-action'].includes(name) ? name : 'working';
}
/** The run a file belongs to, or null when the file is not a research artefact. */
export function runOfFile(project, file) {
  const abs = resolve(file);
  return listRuns(project).find((run) => abs === resolve(project.root, run.report) || abs.startsWith(`${runDir(project, run.topic)}/`)) ?? null;
}

export function lintRun(project, run, { strict = false, only = null } = {}) {
  const ledger = loadLedger(project, run.topic);
  const results = [];
  for (const file of only ? [resolve(only)] : runFiles(project, run)) {
    if (!existsSync(file)) fail(`No such file: ${file}`);
    const issues = lintText(kindOf(project, run, file), readFileSync(file, 'utf8'), ledger, { strict });
    if (issues.length) results.push({ file: relative(project.root, file), issues });
  }
  return results;
}
export const errorCount = (results) => results.reduce((n, r) => n + r.issues.filter((i) => i.startsWith('error')).length, 0);

export function lint({ pos, opt, cwd }) {
  const project = requireProject(cwd);
  const [target] = pos;
  if (!target) fail('Usage: pmr lint <topic | file> [--strict]');
  const isFile = target.endsWith('.md');
  const file = isFile ? resolve(cwd, target) : null;
  const run = isFile ? runOfFile(project, file) ?? fail(`${target} is not part of a research run, so there is no ledger to check it against.`) : loadRun(project, target);
  const results = lintRun(project, run, { strict: Boolean(opt.strict), only: file });
  if (!results.length) { console.log('lint ok'); return; }
  for (const r of results) for (const issue of r.issues) console.log(`${r.file}: ${issue}`);
  if (errorCount(results)) process.exitCode = 1;
}

/** Markdown lines for `## Sources`: every evidence row the report cites, directly or through a claim. */
export function reportSources({ pos, cwd }) {
  const project = requireProject(cwd);
  const run = loadRun(project, pos[0]);
  const report = resolve(project.root, run.report);
  if (!existsSync(report)) fail(`The report ${run.report} does not exist yet.`);
  const ledger = loadLedger(project, run.topic);
  const cited = refsIn(readFileSync(report, 'utf8'));
  const ids = new Set(cited.evidence);
  for (const id of cited.claims) for (const s of ledger.claimsById.get(id)?.sources ?? []) ids.add(s);
  const rows = [...ids].sort().map((id) => ledger.evidenceById.get(id)).filter(Boolean);
  if (!rows.length) { console.log('(the report cites nothing yet)'); return; }
  for (const e of rows) console.log(`- ${e.id} · ${e.url} · ${e.title || e.domain} · ${e.tier}${e.published ? ` · published ${e.published}` : ''} · read ${e.accessed}`);
}
