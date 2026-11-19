/**
 * `pmr` — the command line behind the pm-research skills. It owns every write to research memory so each record has
 * an id, a size budget and a history. Zero dependencies; Node 20 or newer.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLUGIN_ROOT, PmrError } from './store.mjs';
import { claimAdd, claimImport, claimList, claimVerify, evidenceAdd, evidenceImport, evidenceList, evidenceShow } from './ledger.mjs';
import { lint, reportSources } from './lint.mjs';
import { lessonAdd, lessonHit, lessonList, lessonRetire, lessonSet, mistakeAdd, mistakeList, recall } from './lessons.mjs';
import { predictAdd, predictList, predictReport, predictResolve } from './calibration.mjs';
import { profileAdd, profileConfirm, profileList, profileSet } from './profile.mjs';
import { proposalAdd, proposalApplied, proposalApprove, proposalList, proposalReject, proposalRollback, proposalShow } from './proposals.mjs';
import { init, paths, runClose, runList, runRetro, runStart, runStatus } from './runs.mjs';
import { audit, forget, retro, sourceNote, sources } from './audit.mjs';
import { approve, brief, guard, lintHook, stop } from './hooks.mjs';

const HELP = `pmr — research memory for the pm-research plugin

Project
  pmr init [--name n] [--reports docs/research] [--work dir] [--refresh-days 60] [--language en] [--context file.md]
  pmr paths
Runs (one topic, one decision)
  pmr run start <topic> --decision "…" [--door one-way|two-way] [--depth quick|standard|deep]
  pmr run status [topic] | run list | run retro <topic> | run close <topic>
Evidence and claims
  pmr evidence add <topic> --url u --quote "…" [--tier official|primary|third|community] [--title t] [--published d] [--by who]
  pmr evidence import <topic> <file.jsonl | --stdin>     rows: {url, quote, tier, title, published, note, by}
  pmr evidence list <topic> [--grep text] [--tier t] [--full] | evidence show <topic> <E-id>
  pmr claim add <topic> --text "…" --sources E-001,E-002 [--kind fact|inference|unknown]
  pmr claim import <topic> <file.jsonl | --stdin>        rows: {text, kind, sources}
  pmr claim verify <topic> <C-id> --source E-id --verdict supported|partial|refuted|unreachable [--note …] [--by who]
  pmr claim verify <topic> --stdin                       rows: {id, source, verdict, note, by}
  pmr claim list <topic> [--status s] [--pairs]
Artefacts
  pmr lint <topic | file.md> [--strict]
  pmr report sources <topic>
Learning
  pmr mistake add --what "…" [--why "…"] [--skill s] [--topic t] [--source owner|verifier|red-team|self] | mistake list [--open]
  pmr lesson add --trigger "…" --rule "…" [--skill s] [--source …] [--from M-id] | lesson hit <L-id> [--from M-id]
  pmr lesson set <L-id> [--trigger …] [--rule …] [--enforced-by path] [--status s] | lesson retire <L-id> --reason "…" | lesson list
  pmr recall --skill <skill> --topic "…" [--limit 5]      prints working style, project context, then matching lessons
  pmr predict add --text "…" --p 0.7 --due YYYY-MM-DD [--topic t] | predict resolve <PR-id> --outcome true|false|void
  pmr predict list [--open] [--due] | predict report
How the owner works (shared by all projects; a project adds its own through context_file in .pm-research.json)
  pmr profile add --area <word> --rule "…" [--source owner|self]    owner: said in their own words; self: inferred
  pmr profile list [--area a] [--status observed|confirmed] | profile confirm <W-id> | profile set <W-id> [--rule …] [--area …]
Changing the plugin itself (owner approval required)
  pmr proposal add --title "…" --lessons L-001 --targets skills/x/SKILL.md --expect "…" --check-by YYYY-MM-DD <file.md | --stdin>
  pmr proposal list | show <P-id> | reject <P-id> --note "…" | applied <P-id> --note "…" | rollback <P-id> --note "…"
  The owner approves by typing \`approve P-###\` in the chat.
Memory control
  pmr audit | retro | sources | source note <domain> --note "…"
  pmr forget <L-|M-|PR-|P-|W-id>  |  pmr forget <E-|C-id> --topic <topic>
`;

export const COMMANDS = {
  init, paths, lint, recall, forget, audit, retro, sources,
  'run start': runStart, 'run status': runStatus, 'run list': runList, 'run retro': runRetro, 'run close': runClose,
  'evidence add': evidenceAdd, 'evidence import': evidenceImport, 'evidence list': evidenceList, 'evidence show': evidenceShow,
  'claim add': claimAdd, 'claim import': claimImport, 'claim verify': claimVerify, 'claim list': claimList,
  'report sources': reportSources,
  'lesson add': lessonAdd, 'lesson hit': lessonHit, 'lesson set': lessonSet, 'lesson retire': lessonRetire, 'lesson list': lessonList,
  'mistake add': mistakeAdd, 'mistake list': mistakeList,
  'profile add': profileAdd, 'profile confirm': profileConfirm, 'profile set': profileSet, 'profile list': profileList,
  'predict add': predictAdd, 'predict resolve': predictResolve, 'predict list': predictList, 'predict report': predictReport,
  'proposal add': proposalAdd, 'proposal list': proposalList, 'proposal show': proposalShow, 'proposal approve': proposalApprove,
  'proposal reject': proposalReject, 'proposal applied': proposalApplied, 'proposal rollback': proposalRollback,
  'source note': sourceNote,
};
/** Commands Claude Code runs as hooks. `--hook` means "read the hook payload from stdin and never fail the session". */
export const HOOKS = { brief, guard, approve, stop, lint: lintHook };

/** Flags that never take a value. Any other `--key` takes the next token unless that token is itself a flag. */
const BOOLEAN = new Set(['hook', 'strict', 'force', 'stdin', 'open', 'full', 'pairs', 'help', 'version']);

export function parseArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--') || arg === '--') { pos.push(arg); continue; }
    const eq = arg.indexOf('=');
    if (eq > 0) { opt[arg.slice(2, eq)] = arg.slice(eq + 1); continue; }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (BOOLEAN.has(key) || next === undefined || next.startsWith('--')) opt[key] = true;
    else { opt[key] = next; i += 1; }
  }
  return { pos, opt };
}

function version() {
  const manifest = join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json');
  try { return JSON.parse(readFileSync(manifest, 'utf8')).version ?? 'unversioned (loaded in place)'; } catch { return 'unknown'; }
}

export function main(argv = process.argv.slice(2), env = process.env, cwd = process.cwd()) {
  const { pos, opt } = parseArgs(argv);
  if (opt.version) { console.log(`pmr ${version()}`); return; }
  if (!pos.length || opt.help || pos[0] === 'help') { console.log(HELP); return; }

  if (HOOKS[pos[0]] && (opt.hook || pos[0] !== 'lint')) {
    if (pos[0] !== 'brief' && !opt.hook) { console.error(`\`pmr ${pos[0]}\` is a hook entry point; Claude Code calls it with --hook and a JSON payload on stdin.`); process.exitCode = 1; return; }
    // A broken hook must never break the owner's session: report nothing and let the tool call through.
    try { HOOKS[pos[0]]({ pos: pos.slice(1), opt, cwd, env }); } catch (error) { if (env.PMR_DEBUG) console.error(error); if (!opt.hook) { console.error(error.message); process.exitCode = 1; } }
    return;
  }

  const two = `${pos[0]} ${pos[1] ?? ''}`.trim();
  const handler = COMMANDS[two] ? COMMANDS[two] : COMMANDS[pos[0]];
  const rest = COMMANDS[two] && two.includes(' ') ? pos.slice(2) : pos.slice(1);
  if (!handler) {
    const group = Object.keys(COMMANDS).filter((k) => k.startsWith(`${pos[0]} `)).map((k) => k.split(' ')[1]);
    console.error(group.length ? `Unknown: pmr ${two}. \`pmr ${pos[0]}\` takes: ${group.join(', ')}.` : `Unknown command: ${pos[0]}. Run \`pmr help\`.`);
    process.exitCode = 1;
    return;
  }
  try { handler({ pos: rest, opt, cwd, env }); } catch (error) {
    if (!(error instanceof PmrError)) throw error;
    console.error(error.message);
    process.exitCode = 1;
  }
}

function invokedDirectly() { try { return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } }
if (invokedDirectly()) main();
