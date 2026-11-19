/**
 * Hook entry points (Claude Code passes a JSON payload on stdin). Each one turns a rule the skills state into a mechanism:
 * brief    SessionStart      re-inject open research state and due items, in at most 15 lines
 * approve  UserPromptSubmit  record the owner's `approve P-###` / `reject P-###`
 * guard    PreToolUse        memory and ledgers change only through pmr; plugin source only under an approved proposal
 * lint     PostToolUse       check a research artefact right after it is written
 * stop     Stop              one reminder per session when a run touched in it is left unverified or without an after-action
 * A hook must never break a session, so the CLI swallows unexpected errors from these and exits 0.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { LEDGER_FILES, PLUGIN_ROOT, clip, findProject, globalHome, listRuns, readJson, runDir, today } from './store.mjs';
import { approvedTargets, decide, loadProposals } from './proposals.mjs';
import { errorCount, lintRun, runOfFile } from './lint.mjs';
import { loadLessons, staleNotes } from './lessons.mjs';
import { loadPredictions } from './calibration.mjs';
import { observedNote } from './profile.mjs';
import { runState } from './runs.mjs';

function readPayload() { if (process.stdin.isTTY) return {}; try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; } }

/** Real path of a file that may not exist yet: resolve symlinks on its nearest existing ancestor. */
function real(path) {
  let dir = resolve(path); const tail = [];
  while (!existsSync(dir)) { const up = dirname(dir); if (up === dir) break; tail.unshift(basename(dir)); dir = up; }
  try { dir = realpathSync(dir); } catch { /* keep the unresolved path */ }
  return join(dir, ...tail);
}
const inside = (file, dir) => file === dir || file.startsWith(dir + sep);
/** One small file per Claude Code session, in shared memory: when the session began and whether the stop reminder was given. */
const marker = (env, sessionId) => join(globalHome(env), 'sessions', `${String(sessionId ?? 'none').replace(/[^\w-]/g, '')}.json`);
const MARKER_DAYS = 14;

// ---- brief ----
function briefLines(project, env, { detail = false } = {}) {
  const lines = [];
  const open = listRuns(project).filter((r) => r.status === 'open');
  for (const run of open.slice(0, 4)) {
    const s = runState(project, run, env);
    lines.push(`- open run ${run.topic}: ${s.stats.evidence} evidence, ${s.stats.claims} claims (${s.stats.byStatus.unverified ?? 0} unverified). Next: ${s.next}`);
    if (detail) lines.push(`  decision: ${clip(run.decision, 160)}`);
  }
  if (open.length > 4) lines.push(`- and ${open.length - 4} more open runs (\`pmr run status\`)`);
  const stale = staleNotes(project, env);
  if (stale.length) lines.push(`- research notes past their refresh date: ${stale.slice(0, 3).map((s) => `${s.file} (${s.due})`).join(', ')}${stale.length > 3 ? ` and ${stale.length - 3} more` : ''}`);
  const pending = loadProposals(env).filter((p) => p.meta.status === 'pending');
  if (pending.length) lines.push(`- plugin change proposals waiting for the owner: ${pending.map((p) => `${p.meta.id} "${clip(p.meta.title, 50)}"`).join(', ')} (owner types \`approve P-###\` or \`reject P-###\`)`);
  const approved = loadProposals(env).filter((p) => p.meta.status === 'approved');
  if (approved.length) lines.push(`- approved and not yet applied: ${approved.map((p) => p.meta.id).join(', ')} (research-retro skill)`);
  const due = loadPredictions(env).filter((p) => !p.outcome && p.due <= today(env));
  if (due.length) lines.push(`- predictions due for resolution: ${due.slice(0, 4).map((p) => p.id).join(', ')} (\`pmr predict list --due\`)`);
  const promote = loadLessons(env).filter((l) => l.hits >= 2 && l.enforcedBy === 'none');
  if (promote.length) lines.push(`- lessons that keep recurring with nothing enforcing them: ${promote.map((l) => l.id).join(', ')} (research-retro skill)`);
  const observed = observedNote(env);
  if (observed) lines.push(`- ${observed}`);
  const head = `[pm-research] ${project.name}: ${open.length} open research run(s). Product or competitor research goes through the pm-research:pm skill; ledgers and memory change only through \`pmr\`.`;
  return [head, ...lines].slice(0, 15);
}

export function brief({ opt, cwd, env }) {
  const payload = opt.hook ? readPayload() : {};
  const project = findProject(payload.cwd ?? cwd);
  if (project && payload.session_id) {
    const file = marker(env, payload.session_id);
    mkdirSync(dirname(file), { recursive: true });
    for (const f of readdirSync(dirname(file))) { const old = join(dirname(file), f); if (Date.now() - statSync(old).mtimeMs > MARKER_DAYS * 864e5) rmSync(old, { force: true }); }
    if (!existsSync(file)) writeFileSync(file, JSON.stringify({ start: Date.now(), reminded: false }));
  }
  if (!project) { if (!opt.hook) console.log('pm-research is not initialised in this project (`pmr init`).'); return; }
  console.log(briefLines(project, env, { detail: payload.source === 'compact' || payload.source === 'resume' }).join('\n'));
}

// ---- approve ----
export function approve({ env }) {
  const payload = readPayload();
  const m = /^\s*(approve|duyệt|duyet|reject|từ chối|tu choi)\s+(P-\d{3})\b/i.exec(String(payload.prompt ?? ''));
  if (!m) return;
  const status = /^(approve|duy)/i.test(m[1]) ? 'approved' : 'rejected';
  try {
    const p = decide(env, m[2].toUpperCase(), status);
    console.log(status === 'approved'
      ? `[pm-research] The owner approved ${p.meta.id} ("${p.meta.title}"). Apply it with the research-retro skill: work on a branch of the plugin repository, change only ${p.meta.targets} and CHANGELOG.md, run the tests and evals, then record \`pmr proposal applied ${p.meta.id} --note "<commit>"\`.`
      : `[pm-research] The owner rejected ${p.meta.id}. Do not apply it. Ask whether the underlying lesson should be reworded or retired.`);
  } catch (error) { console.log(`[pm-research] Could not record the decision: ${error.message}`); }
}

// ---- guard ----
function guardReason(filePath, env, cwd) {
  if (!filePath) return null;
  const file = real(resolve(cwd, String(filePath)));
  if (inside(file, real(globalHome(env)))) return 'shared research memory is changed only through `pmr` (lesson, mistake, profile, predict, proposal, forget), so every change keeps an id, a size budget and a history';
  if (LEDGER_FILES.includes(basename(file))) {
    const project = findProject(dirname(file));
    if (project && inside(file, real(project.workDir))) return 'the evidence ledger, the claim register and run state are changed only through `pmr` (evidence, claim, run)';
  }
  const root = real(PLUGIN_ROOT);
  if (inside(file, root) && env.PMR_DEV !== '1') {
    const rel = relative(root, file);
    if (!approvedTargets(env).has(rel)) return `the pm-research plugin does not edit its own source during normal work. ${rel} is not a target of an approved proposal. Write one with the research-retro skill (\`pmr proposal add\`) and let the owner approve it; a person developing the plugin starts their session with PMR_DEV=1`;
  }
  return null;
}
export function guard({ env, cwd }) {
  const payload = readPayload();
  const input = payload.tool_input ?? {};
  const reason = guardReason(input.file_path ?? input.notebook_path, env, payload.cwd ?? cwd);
  if (reason) { console.error(`[pm-research] Blocked: ${reason}.`); process.exitCode = 2; }
}

// ---- lint ----
export function lintHook({ cwd }) {
  const payload = readPayload();
  const target = payload.tool_input?.file_path;
  if (!target || !String(target).endsWith('.md')) return;
  const file = resolve(payload.cwd ?? cwd, target);
  const project = findProject(dirname(file));
  const run = project && runOfFile(project, file);
  if (!run || !existsSync(file)) return;
  const results = lintRun(project, run, { only: file });
  if (!results.length) return;
  console.error(`[pm-research] ${relative(project.root, file)} has issues to fix before it can be relied on:\n${results[0].issues.map((i) => `- ${i}`).join('\n')}`);
  if (errorCount(results)) process.exitCode = 2;
}

// ---- stop ----
function newestChange(project, run) {
  const dir = runDir(project, run.topic);
  const files = [...(existsSync(dir) ? readdirSync(dir).map((f) => join(dir, f)) : []), resolve(project.root, run.report)].filter((f) => existsSync(f));
  return Math.max(0, ...files.map((f) => statSync(f).mtimeMs));
}
export function stop({ cwd, env }) {
  const payload = readPayload();
  if (payload.stop_hook_active) return;
  const project = findProject(payload.cwd ?? cwd);
  const state = readJson(marker(env, payload.session_id), null);
  if (!project || !state || state.reminded) return;
  const reasons = [];
  for (const run of listRuns(project).filter((r) => r.status === 'open')) {
    if (newestChange(project, run) < state.start) continue;
    const s = runState(project, run, env);
    const unverified = s.stats.byStatus.unverified ?? 0;
    if (unverified) reasons.push(`${run.topic}: ${unverified} claim(s) are still unverified`);
    else if (s.report && !s.artefacts.afterAction) reasons.push(`${run.topic}: the report exists but there is no after-action yet (\`pmr run retro ${run.topic}\`), so nothing was learned from this run`);
  }
  if (!reasons.length) return;
  writeFileSync(marker(env, payload.session_id), JSON.stringify({ ...state, reminded: true }));
  console.log(JSON.stringify({ decision: 'block', reason: `[pm-research] Before stopping: ${reasons.join('; ')}. Either finish that step now, or tell the user plainly that the research is not final and what remains. This reminder appears once per session.` }));
}
