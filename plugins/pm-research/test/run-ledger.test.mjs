import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseArgs } from '../lib/cli.mjs';
import { claimConfidence, claimStatus } from '../lib/ledger.mjs';
import { FINISHED_BRIEF, GOOD_REPORT, REPORT, WORK, sandbox, seededRun } from './helpers.mjs';

test('parseArgs: values, --key=value, boolean flags and flags with no value', () => {
  const { pos, opt } = parseArgs(['claim', 'verify', 't', '--stdin', 'C-001', '--note=--odd', '--verdict', 'supported', '--due', '--open']);
  assert.deepEqual(pos, ['claim', 'verify', 't', 'C-001']);
  assert.deepEqual(opt, { stdin: true, note: '--odd', verdict: 'supported', due: true, open: true });
});

test('commands outside a project explain how to start', () => {
  const box = sandbox({ init: false });
  const r = box.pmr(['run', 'list']);
  assert.equal(r.code, 1);
  assert.match(r.err, /pmr init/);
});

test('init writes the config and refuses to overwrite it', () => {
  const box = sandbox();
  const cfg = JSON.parse(box.read('.pm-research.json'));
  assert.equal(cfg.project, 'demo');
  assert.equal(cfg.work_dir, 'docs/research/_work');
  assert.equal(box.pmr(['init']).code, 1);
});

test('a run needs a decision and a valid topic slug', () => {
  const box = sandbox();
  assert.match(box.pmr(['run', 'start', 'chat-ui']).err, /--decision/);
  assert.match(box.pmr(['run', 'start', 'Chat UI', '--decision', 'x']).err, /kebab-case/);
  assert.match(box.pmr(['run', 'start', 'chat-ui', '--decision', 'x', '--door', 'sideways']).err, /one-way/);
});

test('run start writes the brief and run state; a one-way door defaults to deep', () => {
  const box = sandbox();
  const out = box.ok(['run', 'start', 'chat-ui', '--decision', 'Build or keep', '--door', 'one-way']);
  assert.match(out, /started chat-ui \(deep, one-way door\)/);
  assert.doesNotMatch(out, /Earlier work/, 'the new run is not its own prior work');
  const run = JSON.parse(box.read(`${WORK}/chat-ui/run.json`));
  assert.equal(run.report, REPORT);
  assert.match(box.read(`${WORK}/chat-ui/brief.md`), /^Decision: Build or keep$/m);
  assert.match(box.read(`${WORK}/index.md`), /\| chat-ui \| open \|/);
  assert.equal(box.pmr(['run', 'start', 'chat-ui', '--decision', 'again']).code, 1);
});

test('evidence: import skips duplicates and reports bad rows; ids are sequential', () => {
  const box = sandbox();
  seededRun(box);
  const out = box.ok(['evidence', 'import', 'chat-ui', '--stdin'], { input: [
    '{"url":"https://vendor.example/pricing","quote":"The Pro plan costs $20 per month.","tier":"official"}',
    '{"url":"https://vendor.example/docs","quote":"Sessions are stored for 30 days.","tier":"official"}',
    '{"url":"https://vendor.example/docs","quote":"x","tier":"rumour"}',
    '{"quote":"no url"}',
  ].join('\n') });
  assert.match(out, /added 1 \(E-003\), duplicates 1, rejected 2/);
  assert.match(out, /row 3: tier must be one of/);
  assert.match(box.pmr(['evidence', 'add', 'chat-ui', '--url', 'https://a.example', '--quote', 'q'.repeat(601)]).err, /max 600/);
  assert.match(box.ok(['evidence', 'list', 'chat-ui', '--tier', 'community']), /^E-002 \[community\] forum\.example/);
});

test('claims: facts need evidence that exists; unknowns are open questions', () => {
  const box = sandbox();
  seededRun(box);
  assert.match(box.pmr(['claim', 'add', 'chat-ui', '--text', 'It is the market leader']).err, /needs at least one evidence id/);
  assert.match(box.pmr(['claim', 'add', 'chat-ui', '--text', 'It is the market leader', '--sources', 'E-009']).err, /E-009 is not in the evidence ledger/);
  const out = box.ok(['claim', 'list', 'chat-ui']);
  assert.match(out, /C-001 \[unverified·U\] fact/);
  assert.match(out, /C-003 \[open question\] unknown/);
  assert.match(box.pmr(['claim', 'verify', 'chat-ui', 'C-003', '--verdict', 'supported']).out, /open question, not a checkable claim/);
});

test('claim status and confidence are derived from pair checks', () => {
  const ev = new Map([['E-1', { tier: 'official' }], ['E-2', { tier: 'community' }]]);
  const claim = (checks, sources = ['E-1', 'E-2']) => ({ kind: 'fact', sources, checks });
  assert.equal(claimStatus(claim({})), 'unverified');
  assert.equal(claimStatus(claim({ 'E-1': { verdict: 'supported' } })), 'unverified', 'every cited pair must be checked');
  assert.equal(claimStatus(claim({ 'E-1': { verdict: 'supported' }, 'E-2': { verdict: 'refuted' } })), 'contested');
  assert.equal(claimStatus(claim({ 'E-1': { verdict: 'partial' }, 'E-2': { verdict: 'unreachable' } })), 'partial');
  assert.equal(claimStatus(claim({ 'E-2': { verdict: 'unreachable' } }, ['E-2'])), 'unreachable');
  assert.equal(claimConfidence(claim({ 'E-1': { verdict: 'supported' }, 'E-2': { verdict: 'partial' } }), ev), 'C');
  assert.equal(claimConfidence(claim({ 'E-2': { verdict: 'supported' } }, ['E-2']), ev), 'T');
  assert.equal(claimConfidence(claim({ 'E-1': { verdict: 'refuted' } }, ['E-1']), ev), 'U');
});

test('verification records per-pair verdicts and the track record of each domain', () => {
  const box = sandbox();
  seededRun(box);
  assert.match(box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported', '--by', 'claim-verifier']), /C-001×E-001 supported → supported/);
  const batch = box.pmr(['claim', 'verify', 'chat-ui', '--stdin'], { input: '{"id":"C-002","source":"E-002","verdict":"refuted","note":"the thread is about another product"}\n{"id":"C-002","source":"E-001","verdict":"supported"}\n{"id":"C-001","verdict":"maybe"}' });
  assert.equal(batch.code, 1);
  assert.match(batch.out, /C-002×E-002 refuted → refuted/);
  assert.match(batch.out, /C-002 does not cite E-001/);
  assert.match(batch.out, /verdict must be one of/);
  assert.match(box.ok(['claim', 'list', 'chat-ui', '--status', 'refuted']), /^C-002 \[refuted·U\]/);
  const sources = readFileSync(join(box.home, 'sources.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(sources.map((s) => [s.domain, s.supported, s.refuted]), [['forum.example', 0, 1], ['vendor.example', 1, 0]]);
  assert.match(box.ok(['run', 'status', 'chat-ui']), /failed verification: 50%/);
});

test('the next step of a run follows what exists on disk, and close refuses until the loop is complete', () => {
  const box = sandbox();
  const next = () => /next: (.*)/.exec(box.ok(['run', 'status', 'chat-ui']))[1];
  box.ok(['run', 'start', 'chat-ui', '--decision', 'Build our own chat interface or keep a third-party client']);
  assert.match(next(), /finish the brief/);
  box.write(`${WORK}/chat-ui/brief.md`, FINISHED_BRIEF);
  assert.match(next(), /collect evidence/);
  box.ok(['evidence', 'add', 'chat-ui', '--url', 'https://vendor.example/pricing', '--quote', 'The Pro plan costs $20 per month.', '--tier', 'official', '--title', 'Pricing']);
  box.ok(['evidence', 'add', 'chat-ui', '--url', 'https://forum.example/thread/9', '--quote', 'It forgets context after an hour.', '--tier', 'community', '--title', 'Forum thread']);
  assert.match(next(), /write the claims/);
  box.ok(['claim', 'add', 'chat-ui', '--text', 'The Pro plan costs 20 USD per month', '--sources', 'E-001']);
  box.ok(['claim', 'add', 'chat-ui', '--text', 'Users lose context in long sessions', '--sources', 'E-002', '--kind', 'inference']);
  box.ok(['claim', 'add', 'chat-ui', '--text', 'Is there an offline mode?', '--kind', 'unknown']);
  assert.match(next(), /verify 2 claim\(s\)/);
  box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'supported']);
  assert.match(next(), /write the report at docs\/research\/chat-ui-2026-11\.md/);

  const early = box.pmr(['run', 'close', 'chat-ui']);
  assert.equal(early.code, 1);
  assert.match(early.err, /no report/);
  assert.match(early.err, /no prediction/);
  assert.match(early.err, /no after-action/);

  box.write(REPORT, GOOD_REPORT);
  assert.equal(box.ok(['lint', 'chat-ui', '--strict']).trim(), 'lint ok');
  assert.match(next(), /pmr predict add/);
  box.ok(['predict', 'add', '--topic', 'chat-ui', '--text', 'The Pro price is still 20 USD on 2027-02-01', '--p', '0.8', '--due', '2027-02-01']);
  assert.match(next(), /pmr run retro chat-ui/);
  box.ok(['mistake', 'add', '--topic', 'chat-ui', '--skill', 'deep-research', '--what', 'Searched forums before reading the official pricing page']);
  assert.match(box.ok(['run', 'retro', 'chat-ui']), /Claims: 3; supported 2,/);
  const afterAction = `${WORK}/chat-ui/after-action.md`;
  assert.match(box.read(afterAction), /Mistakes logged: M-001 \(no lesson yet\)/);

  const unfinished = box.pmr(['run', 'close', 'chat-ui']);
  assert.match(unfinished.err, /unfinished `TODO` markers/);
  assert.match(unfinished.err, /M-001 have no lesson/);
  assert.match(unfinished.err, /names no lesson/);

  box.ok(['lesson', 'add', '--trigger', 'starting to collect evidence on a product', '--rule', 'read the official pricing and docs pages before community threads', '--skill', 'deep-research', '--from', 'M-001']);
  box.write(afterAction, box.read(afterAction).replace(/^- TODO$/gm, '- done').replace('## Lessons\n', '## Lessons\n- L-001 official pages first\n'));
  assert.match(box.ok(['run', 'close', 'chat-ui']), /closed chat-ui/);
  assert.match(box.read(`${WORK}/index.md`), /\| chat-ui \| closed \|.*\| docs\/research\/chat-ui-2026-11\.md \|/);
  assert.equal(box.ok(['run', 'status']).trim(), 'no open research runs');
  assert.equal(box.pmr(['run', 'close', 'chat-ui']).code, 1);
  assert.ok(existsSync(join(box.home, 'mistakes.jsonl')));
});
