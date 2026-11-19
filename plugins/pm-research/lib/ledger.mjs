/**
 * Evidence ledger and claim register of one research run.
 * Evidence is a verbatim quote with its source. A claim cites evidence and is checked one claim-source pair at a time;
 * its status and confidence are derived from those checks, never typed in by the author.
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { appendJsonl, clip, fail, forgottenIds, gpath, list, loadRun, nextId, oneLine, readJsonl, requireProject, runDir, today, writeJsonl } from './store.mjs';

export const TIERS = ['official', 'primary', 'third', 'community'];
export const VERDICTS = ['supported', 'partial', 'refuted', 'unreachable'];
const KINDS = ['fact', 'inference', 'unknown'];
const QUOTE_MAX = 600;
const CLAIM_MAX = 300;

export function evidenceFile(project, topic) { return join(runDir(project, topic), 'evidence.jsonl'); }
export function claimsFile(project, topic) { return join(runDir(project, topic), 'claims.jsonl'); }
export function loadLedger(project, topic) {
  const evidence = readJsonl(evidenceFile(project, topic));
  const claims = readJsonl(claimsFile(project, topic));
  return { evidence, claims, evidenceById: new Map(evidence.map((e) => [e.id, e])), claimsById: new Map(claims.map((c) => [c.id, c])) };
}

function domainOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'local'; } }

function cleanEvidence(input, env) {
  const url = oneLine(input.url);
  const quote = oneLine(input.quote);
  if (!url) return { error: 'missing url (an http(s) link, or a project-relative file path for a local document)' };
  if (/^https?:/i.test(url)) { try { new URL(url); } catch { return { error: `not a valid URL: ${url}` }; } }
  if (!quote) return { error: 'missing quote (the verbatim sentence that carries the fact)' };
  if (quote.length > QUOTE_MAX) return { error: `quote is ${quote.length} characters; keep only the sentence that carries the fact (max ${QUOTE_MAX})` };
  const tier = input.tier ?? 'third';
  if (!TIERS.includes(tier)) return { error: `tier must be one of ${TIERS.join(', ')}` };
  return { row: { url, domain: domainOf(url), title: oneLine(input.title), quote, tier, published: oneLine(input.published) || null, accessed: today(env), note: oneLine(input.note) || null, by: oneLine(input.by) || null } };
}

function addEvidenceRows(project, topic, inputs, env) {
  loadRun(project, topic);
  const file = evidenceFile(project, topic);
  const existing = readJsonl(file);
  const ids = [...existing.map((e) => e.id), ...forgottenIds(runDir(project, topic))];
  const added = []; const duplicates = []; const rejected = [];
  inputs.forEach((input, i) => {
    const { row, error } = cleanEvidence(input, env);
    if (error) { rejected.push(`row ${i + 1}: ${error}`); return; }
    const same = existing.find((e) => e.url === row.url && e.quote === row.quote);
    if (same) { duplicates.push(same.id); return; }
    const id = nextId('E', ids);
    ids.push(id);
    const full = { id, ...row };
    existing.push(full);
    appendJsonl(file, full);
    added.push(id);
  });
  return { added, duplicates, rejected };
}

function parseRows(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) { try { return JSON.parse(trimmed); } catch { return fail('Input looks like a JSON array but does not parse.'); } }
  return trimmed.split('\n').filter((l) => l.trim()).map((line, i) => { try { return JSON.parse(line); } catch { return fail(`Input line ${i + 1} is not valid JSON.`); } });
}
function readInput(source) { return parseRows(readFileSync(!source || source === '-' ? 0 : source, 'utf8')); }

export function evidenceAdd({ pos, opt, cwd, env }) {
  const project = requireProject(cwd);
  const [topic] = pos;
  const { added, duplicates, rejected } = addEvidenceRows(project, topic, [opt], env);
  if (rejected.length) fail(`Evidence not added: ${rejected[0].replace(/^row 1: /, '')}.`);
  console.log(added.length ? `added ${added[0]}` : `already recorded as ${duplicates[0]}`);
}

export function evidenceImport({ pos, opt, cwd, env }) {
  const project = requireProject(cwd);
  const [topic, source] = pos;
  const { added, duplicates, rejected } = addEvidenceRows(project, topic, readInput(opt.stdin ? '-' : source), env);
  const range = added.length ? ` (${added[0]}${added.length > 1 ? `..${added.at(-1)}` : ''})` : '';
  console.log(`added ${added.length}${range}, duplicates ${duplicates.length}, rejected ${rejected.length}`);
  for (const r of rejected) console.log(`  rejected ${r}`);
  if (rejected.length && !added.length && !duplicates.length) process.exitCode = 1;
}

export function evidenceList({ pos, opt, cwd }) {
  const project = requireProject(cwd);
  const [topic] = pos;
  loadRun(project, topic);
  const needle = typeof opt.grep === 'string' ? opt.grep.toLowerCase() : null;
  const rows = readJsonl(evidenceFile(project, topic)).filter((e) => (!opt.tier || e.tier === opt.tier) && (!needle || JSON.stringify(e).toLowerCase().includes(needle)));
  if (!rows.length) { console.log('no evidence rows'); return; }
  for (const e of rows) console.log(`${e.id} [${e.tier}] ${e.domain} — ${clip(e.title || '(untitled)', 50)} — "${clip(e.quote, opt.full ? 600 : 110)}"`);
}

export function evidenceShow({ pos, cwd }) {
  const project = requireProject(cwd);
  const [topic, id] = pos;
  loadRun(project, topic);
  const row = readJsonl(evidenceFile(project, topic)).find((e) => e.id === id) ?? fail(`No evidence ${id} in ${topic}.`);
  console.log(JSON.stringify(row, null, 2));
}

// ---- claims ----
/** contested > unverified > refuted > partial > supported > unreachable: a claim is as strong as its weakest checked pair. `unknown` claims are open questions and are never verified. */
export function claimStatus(claim) {
  if (claim.kind === 'unknown') return 'open';
  const verdicts = (claim.sources ?? []).map((s) => claim.checks?.[s]?.verdict);
  if (verdicts.includes('supported') && verdicts.includes('refuted')) return 'contested';
  if (!verdicts.length || verdicts.some((v) => !v)) return 'unverified';
  for (const v of ['refuted', 'partial', 'supported']) if (verdicts.includes(v)) return v;
  return 'unreachable';
}
/** C = supported by an official or primary source (for an inference: by such sources only), T = otherwise supported, U = not established. */
export function claimConfidence(claim, evidenceById) {
  if (claimStatus(claim) !== 'supported') return 'U';
  const supported = claim.sources.filter((s) => claim.checks?.[s]?.verdict === 'supported');
  const isStrong = (s) => ['official', 'primary'].includes(evidenceById.get(s)?.tier);
  const strong = claim.kind === 'inference' ? supported.every(isStrong) : supported.some(isStrong);
  return strong ? 'C' : 'T';
}

function addClaimRows(project, topic, inputs, env) {
  loadRun(project, topic);
  const file = claimsFile(project, topic);
  const { claims, evidenceById } = loadLedger(project, topic);
  const ids = [...claims.map((c) => c.id), ...forgottenIds(runDir(project, topic))];
  const added = []; const rejected = [];
  inputs.forEach((input, i) => {
    const text = oneLine(input.text);
    const kind = input.kind ?? 'fact';
    const sources = Array.isArray(input.sources) ? input.sources : list(input.sources);
    const bad = (reason) => rejected.push(`row ${i + 1}: ${reason}`);
    if (!text) return bad('missing text');
    if (text.length > CLAIM_MAX) return bad(`claim is ${text.length} characters; one claim states one checkable thing (max ${CLAIM_MAX})`);
    if (!KINDS.includes(kind)) return bad(`kind must be one of ${KINDS.join(', ')}`);
    if (kind !== 'unknown' && !sources.length) return bad(`a ${kind} needs at least one evidence id in sources; if nothing supports it yet, record it as kind "unknown"`);
    const missing = sources.find((s) => !evidenceById.has(s));
    if (missing) return bad(`source ${missing} is not in the evidence ledger`);
    if (claims.some((c) => c.text === text)) return bad('same text is already recorded');
    const id = nextId('C', ids);
    ids.push(id);
    const row = { id, text, kind, sources, checks: {}, created: today(env) };
    claims.push(row);
    appendJsonl(file, row);
    return added.push(id);
  });
  return { added, rejected };
}

export function claimAdd({ pos, opt, cwd, env }) {
  const project = requireProject(cwd);
  const { added, rejected } = addClaimRows(project, pos[0], [opt], env);
  if (rejected.length) fail(`Claim not added: ${rejected[0].replace(/^row 1: /, '')}.`);
  console.log(`added ${added[0]} (unverified)`);
}

export function claimImport({ pos, opt, cwd, env }) {
  const project = requireProject(cwd);
  const { added, rejected } = addClaimRows(project, pos[0], readInput(opt.stdin ? '-' : pos[1]), env);
  console.log(`added ${added.length}${added.length ? ` (${added[0]}..${added.at(-1)})` : ''}, rejected ${rejected.length}`);
  for (const r of rejected) console.log(`  rejected ${r}`);
  if (rejected.length && !added.length) process.exitCode = 1;
}

/** Per-domain track record in the shared tier: how often claims resting on a domain survived verification. */
function bumpSource(env, domain, tier, verdict) {
  const file = gpath('sources.jsonl', env);
  const rows = readJsonl(file);
  let row = rows.find((r) => r.domain === domain);
  if (!row) { row = { domain, tier, supported: 0, partial: 0, refuted: 0, unreachable: 0, note: null }; rows.push(row); }
  row[verdict] = (row[verdict] ?? 0) + 1;
  row.updated = today(env);
  writeJsonl(file, rows.sort((a, b) => a.domain.localeCompare(b.domain)));
}

export function claimVerify({ pos, opt, cwd, env }) {
  const project = requireProject(cwd);
  const [topic, id] = pos;
  loadRun(project, topic);
  const checks = opt.stdin || opt.file ? readInput(opt.stdin ? '-' : opt.file) : [{ id, source: opt.source, verdict: opt.verdict, note: opt.note, by: opt.by }];
  const { claims, evidenceById } = loadLedger(project, topic);
  const done = []; const rejected = [];
  checks.forEach((check, i) => {
    const claim = claims.find((c) => c.id === check.id);
    const bad = (reason) => rejected.push(`check ${i + 1}: ${reason}`);
    if (!claim) return bad(`no claim ${check.id}`);
    if (claim.kind === 'unknown') return bad(`${claim.id} is an open question, not a checkable claim`);
    const source = check.source ?? (claim.sources.length === 1 ? claim.sources[0] : null);
    if (!source) return bad(`${claim.id} cites ${claim.sources.join(', ')}; name the one checked with --source`);
    if (!claim.sources.includes(source)) return bad(`${claim.id} does not cite ${source}`);
    if (!VERDICTS.includes(check.verdict)) return bad(`verdict must be one of ${VERDICTS.join(', ')}`);
    claim.checks = { ...claim.checks, [source]: { verdict: check.verdict, note: oneLine(check.note) || null, by: oneLine(check.by) || null, at: today(env) } };
    const ev = evidenceById.get(source);
    if (ev) bumpSource(env, ev.domain, ev.tier, check.verdict);
    return done.push(`${claim.id}×${source} ${check.verdict} → ${claimStatus(claim)}`);
  });
  if (done.length) writeJsonl(claimsFile(project, topic), claims);
  for (const d of done) console.log(d);
  for (const r of rejected) console.log(`rejected ${r}`);
  if (rejected.length) process.exitCode = 1;
}

export function claimList({ pos, opt, cwd }) {
  const project = requireProject(cwd);
  const [topic] = pos;
  loadRun(project, topic);
  const { claims, evidenceById } = loadLedger(project, topic);
  const rows = claims.filter((c) => !opt.status || claimStatus(c) === opt.status);
  if (!rows.length) { console.log(opt.status ? `no ${opt.status} claims` : 'no claims'); return; }
  for (const c of rows) {
    const status = claimStatus(c);
    const tag = status === 'open' ? 'open question' : `${status}·${claimConfidence(c, evidenceById)}`;
    console.log(`${c.id} [${tag}] ${c.kind}: ${c.text}${c.sources.length ? ` (${c.sources.join(', ')})` : ''}`);
    if (opt.pairs) for (const s of c.sources) { const e = evidenceById.get(s); console.log(`    ${s} ${c.checks?.[s]?.verdict ?? 'unchecked'} · ${e?.url ?? '?'} · "${clip(e?.quote ?? '', 160)}"`); }
  }
}

export function ledgerStats(project, topic) {
  const { evidence, claims, evidenceById } = loadLedger(project, topic);
  const byTier = {}; const byStatus = {};
  for (const e of evidence) byTier[e.tier] = (byTier[e.tier] ?? 0) + 1;
  for (const c of claims) { const s = claimStatus(c); byStatus[s] = (byStatus[s] ?? 0) + 1; }
  const checked = claims.filter((c) => !['open', 'unverified'].includes(claimStatus(c))).length;
  const failed = (byStatus.refuted ?? 0) + (byStatus.contested ?? 0);
  const cited = new Set(claims.flatMap((c) => c.sources));
  return {
    evidence: evidence.length, claims: claims.length, byTier, byStatus, checked,
    failRate: checked ? failed / checked : null,
    unusedEvidence: evidence.filter((e) => !cited.has(e.id)).map((e) => e.id),
    confirmed: claims.filter((c) => claimConfidence(c, evidenceById) === 'C').length,
  };
}
