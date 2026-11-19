import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PLUGIN, 'lib', 'cli.mjs');
export const TODAY = '2026-11-19';

/** A throwaway project plus a throwaway shared-memory home. Nothing touches the real `~/.pm-research`. */
export function sandbox({ init = true } = {}) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'pmr-test-')));
  const box = { base, project: join(base, 'project'), home: join(base, 'home'), today: TODAY };
  mkdirSync(box.project);
  box.pmr = (args, { input = '', cwd = box.project, env = {}, today = box.today } = {}) => {
    const r = spawnSync(process.execPath, [CLI, ...args], { cwd, input, encoding: 'utf8', env: { PATH: process.env.PATH, PM_RESEARCH_HOME: box.home, PMR_TODAY: today, ...env } });
    return { code: r.status, out: r.stdout, err: r.stderr, all: `${r.stdout}${r.stderr}` };
  };
  /** Runs a command that must succeed and returns its stdout. */
  box.ok = (args, options) => {
    const r = box.pmr(args, options);
    if (r.code !== 0) throw new Error(`pmr ${args.join(' ')} exited ${r.code}: ${r.all}`);
    return r.out;
  };
  box.hook = (name, payload, options = {}) => box.pmr([name, '--hook'], { ...options, input: JSON.stringify({ cwd: box.project, ...payload }) });
  box.read = (rel) => readFileSync(join(box.project, rel), 'utf8');
  box.write = (rel, text) => { mkdirSync(dirname(join(box.project, rel)), { recursive: true }); writeFileSync(join(box.project, rel), text); };
  box.config = (patch) => { const file = join(box.project, '.pm-research.json'); writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), ...patch }, null, 2)); };
  if (init) box.ok(['init', '--name', 'demo']);
  return box;
}

export const WORK = 'docs/research/_work';
export const REPORT = 'docs/research/chat-ui-2026-11.md';

/** A run with two evidence rows and three claims: C-001 fact on official E-001, C-002 inference on E-002, C-003 open question. */
export function seededRun(box, topic = 'chat-ui') {
  box.ok(['run', 'start', topic, '--decision', 'Build our own chat interface or keep a third-party client']);
  box.ok(['evidence', 'import', topic, '--stdin'], { input: [
    { url: 'https://vendor.example/pricing', quote: 'The Pro plan costs $20 per month.', tier: 'official', title: 'Pricing' },
    { url: 'https://forum.example/thread/9', quote: 'It forgets context after an hour.', tier: 'community', title: 'Forum thread' },
  ].map((r) => JSON.stringify(r)).join('\n') });
  box.ok(['claim', 'import', topic, '--stdin'], { input: JSON.stringify([
    { text: 'The Pro plan costs 20 USD per month', kind: 'fact', sources: ['E-001'] },
    { text: 'Users lose context in long sessions', kind: 'inference', sources: ['E-002'] },
    { text: 'Is there an offline mode?', kind: 'unknown' },
  ]) });
  return topic;
}

export const FINISHED_BRIEF = `# Research brief: chat-ui

Decision: Build our own chat interface or keep a third-party client

## Questions
1. What does the leading client cost?

## Hypotheses
- H1 (70%): it costs about 20 USD a month.

## Source plan
- Q1: official pricing page.

## Stop rule
Ten pages, or two scouts in a row that add no new claim.

## Out of scope
- Enterprise plans.
`;

export const GOOD_REPORT = `# Chat interface: build or keep

verified: 2026-11-19 · refresh_after: 2027-01-18 · method: pmr deep-research, 2 sources read first-hand

Decision: Build our own chat interface or keep a third-party client

## Findings
- The Pro plan costs 20 USD per month [C-001].
- Users lose context in long sessions [C-002].

## Open questions
- Is there an offline mode? [C-003]

## Recommendation
Keep the third-party client for now.
Confidence: 70%
What would change my mind: a price above 40 USD per month.

## Sources
- E-001 · https://vendor.example/pricing · Pricing · official · read 2026-11-19
- E-002 · https://forum.example/thread/9 · Forum thread · community · read 2026-11-19
`;
