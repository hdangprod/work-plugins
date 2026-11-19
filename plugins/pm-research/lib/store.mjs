/**
 * Paths, config discovery and small file helpers shared by every pmr command.
 * Two memory tiers: the global home (method lessons and the owner's working style, shared by all projects) and the
 * project, declared in `.pm-research.json` (its context file, and the evidence, claims and artefacts of each run).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_NAME = '.pm-research.json';
export const LEDGER_FILES = ['evidence.jsonl', 'claims.jsonl', 'run.json', 'forgotten.jsonl'];

/** A failure the user can act on. The CLI prints the message and exits 1 without a stack trace. */
export class PmrError extends Error {}
export function fail(message) { throw new PmrError(message); }

const pad = (n) => String(n).padStart(2, '0');
/** Local calendar date. `PMR_TODAY` pins it for tests. */
export function today(env = process.env) {
  if (env.PMR_TODAY) return env.PMR_TODAY;
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? '')) && !Number.isNaN(Date.parse(s)); }
export function daysBetween(from, to) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000); }

export function oneLine(s) { return String(s ?? '').replace(/\s+/g, ' ').trim(); }
export function list(v) { return v === undefined || v === true ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean); }
export function clip(s, n) { const t = oneLine(s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; }

const STOP = new Set('the and for with that this from into over when then than them they their have has had was were are but not you your our out about what which will would should could can must may its also only each any all one two per how why who use used using more most less very before after without within while where does did done being been'.split(' '));
export function tokens(text) {
  return [...new Set(String(text ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w)))];
}
/** Jaccard overlap of content words, 0..1. Used to catch duplicate lessons and to rank recall. */
export function similarity(a, b) {
  const A = new Set(tokens(a)); const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared += 1;
  return shared / (A.size + B.size - shared);
}

// ---- files ----
export function atomicWrite(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
}
export function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((line, i) => {
    try { return JSON.parse(line); } catch { return fail(`${file}:${i + 1} is not valid JSON. Repair or remove that line.`); }
  });
}
export function appendJsonl(file, row) { mkdirSync(dirname(file), { recursive: true }); appendFileSync(file, `${JSON.stringify(row)}\n`); }
export function writeJsonl(file, rows) { atomicWrite(file, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')); }
export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fail(`${file} is not valid JSON.`); }
}

/** Next `PREFIX-NNN`. Forgotten ids are passed in too, so an id is never reused. */
export function nextId(prefix, ids) {
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const id of ids) { const m = re.exec(String(id ?? '')); if (m) max = Math.max(max, Number(m[1])); }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
export function forgottenIds(dir) { return readJsonl(join(dir, 'forgotten.jsonl')).map((r) => r.id); }
export function recordForgotten(dir, id, env) { appendJsonl(join(dir, 'forgotten.jsonl'), { id, at: today(env) }); }

// ---- global tier ----
export function globalHome(env = process.env) { return env.PM_RESEARCH_HOME ? resolve(env.PM_RESEARCH_HOME) : join(homedir(), '.pm-research'); }
export function ensureGlobal(env = process.env) {
  const home = globalHome(env);
  mkdirSync(join(home, 'proposals'), { recursive: true });
  return home;
}
export function gpath(name, env = process.env) { return join(globalHome(env), name); }

// ---- project tier ----
export function findProject(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, CONFIG_NAME))) return loadProject(dir);
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function loadProject(root) {
  const cfg = readJson(join(root, CONFIG_NAME), {});
  const reports = cfg.reports_dir ?? 'research';
  return {
    root,
    name: cfg.project ?? basename(root),
    reportsDir: resolve(root, reports),
    workDir: resolve(root, cfg.work_dir ?? join(reports, '_work')),
    refreshDays: Number(cfg.refresh_days ?? 60),
    language: cfg.language ?? 'en',
    contextFile: typeof cfg.context_file === 'string' && cfg.context_file.trim() ? resolve(root, cfg.context_file) : null,
    privateTerms: (Array.isArray(cfg.private_terms) ? cfg.private_terms : []).filter((t) => typeof t === 'string' && t.trim()),
  };
}
export function requireProject(cwd) {
  return findProject(cwd) ?? fail(`No ${CONFIG_NAME} here or in any parent directory. Run \`pmr init\` in the project root first.`);
}

/** Shared memory must stay project-neutral: refuse text that contains a term the project marked private. */
export function assertShareable(project, ...texts) {
  if (!project) return;
  const hay = texts.join('\n').toLowerCase();
  const index = project.privateTerms.findIndex((t) => hay.includes(t.toLowerCase()));
  if (index >= 0) fail(`Refused: the text contains private term #${index + 1} from ${CONFIG_NAME}. Shared memory is reused across projects; rephrase it as a general method note.`);
}

// ---- runs ----
export function validTopic(topic) {
  if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(String(topic ?? ''))) fail('Topic must be a short kebab-case slug, for example `personal-agent-ui` (lowercase letters, digits and dashes).');
  return topic;
}
export function runDir(project, topic) { return join(project.workDir, topic); }
export function loadRun(project, topic) {
  const file = join(runDir(project, validTopic(topic)), 'run.json');
  if (!existsSync(file)) fail(`No research run named "${topic}". See \`pmr run list\` or start one with \`pmr run start ${topic} --decision "…"\`.`);
  return readJson(file);
}
export function saveRun(project, run) { atomicWrite(join(runDir(project, run.topic), 'run.json'), `${JSON.stringify(run, null, 2)}\n`); }
export function listRuns(project) {
  if (!existsSync(project.workDir)) return [];
  return readdirSync(project.workDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(project.workDir, d.name, 'run.json')))
    .map((d) => readJson(join(project.workDir, d.name, 'run.json')))
    .sort((a, b) => String(a.created).localeCompare(String(b.created)) || a.topic.localeCompare(b.topic));
}

export function template(skill, name, vars = {}) {
  const file = join(PLUGIN_ROOT, 'skills', skill, 'templates', name);
  if (!existsSync(file)) fail(`Template missing: ${file}`);
  return readFileSync(file, 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}
