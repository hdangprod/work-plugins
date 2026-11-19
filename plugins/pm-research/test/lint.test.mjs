import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lintText, section } from '../lib/lint.mjs';
import { GOOD_REPORT, REPORT, WORK, sandbox, seededRun } from './helpers.mjs';

const errors = (issues) => issues.filter((i) => i.startsWith('error')).join('\n');

test('section returns the body under a heading up to the next heading of the same level', () => {
  const text = '# T\n## A\none\n### A.1\ntwo\n## B\nthree\n';
  assert.equal(section(text, /^a\b/i), 'one\n### A.1\ntwo');
  assert.equal(section(text, /^missing/i), null);
});

test('a report with no structure fails on every required part', () => {
  const found = errors(lintText('report', '# Notes\n\nSome thoughts.\n', null));
  for (const part of [/header line `verified/, /`Decision:` line/, /Open questions/, /`## Sources`/, /`## Recommendation`/]) assert.match(found, part);
});

test('a recommendation must state confidence and what would change it', () => {
  const text = GOOD_REPORT.replace('Confidence: 70%\n', '').replace(/What would change my mind.*\n/, '');
  const found = errors(lintText('report', text, null));
  assert.match(found, /Confidence: NN%/);
  assert.match(found, /change my mind/);
});

test('refresh_after must be later than verified', () => {
  assert.match(errors(lintText('report', GOOD_REPORT.replace('refresh_after: 2027-01-18', 'refresh_after: 2026-11-19'), null)), /refresh_after must be later/);
});

test('report citations are checked against the ledger', () => {
  const box = sandbox();
  seededRun(box);
  box.write(REPORT, GOOD_REPORT);

  const unverified = box.ok(['lint', 'chat-ui']);
  assert.match(unverified, /warn: C-001 is cited but not verified yet/);
  const strict = box.pmr(['lint', 'chat-ui', '--strict']);
  assert.equal(strict.code, 1);
  assert.match(strict.out, /error: C-001 is cited but not verified yet/);

  box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'refuted']);
  const refuted = box.pmr(['lint', REPORT]);
  assert.equal(refuted.code, 1);
  assert.match(refuted.out, /C-002 was refuted by verification and is still cited/);

  box.write(REPORT, GOOD_REPORT.replace('[C-002]', '[C-009] [E-007]').replace(/^- E-001 · .*\n/m, ''));
  const broken = box.pmr(['lint', REPORT]).out;
  assert.match(broken, /C-009 is cited but is not in the claim register/);
  assert.match(broken, /E-007 is cited but is not in the evidence ledger/);
  assert.match(broken, /Sources does not list E-001/);
});

test('a contested claim must be shown as a contradiction', () => {
  const box = sandbox();
  seededRun(box);
  box.ok(['claim', 'add', 'chat-ui', '--text', 'The product keeps context for a full day', '--sources', 'E-001,E-002']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-004', '--source', 'E-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-004', '--source', 'E-002', '--verdict', 'refuted']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'supported']);
  box.write(REPORT, GOOD_REPORT.replace('## Open questions', '- It keeps context for a day [C-004].\n\n## Open questions'));
  assert.match(box.pmr(['lint', REPORT]).out, /C-004 is contested/);
  box.write(REPORT, GOOD_REPORT.replace('## Open questions', '## Contradictions\n- Sources disagree on context retention [C-004].\n\n## Open questions'));
  assert.equal(box.ok(['lint', REPORT]).trim(), 'lint ok');
});

test('report sources prints the lines the Sources section needs, including evidence reached through claims', () => {
  const box = sandbox();
  seededRun(box);
  box.write(REPORT, GOOD_REPORT);
  const out = box.ok(['report', 'sources', 'chat-ui']);
  assert.match(out, /^- E-001 · https:\/\/vendor\.example\/pricing · Pricing · official · read 2026-11-19$/m);
  assert.match(out, /^- E-002 · /m);
});

const OPTIONS = `# Options

## Option A: build our own interface
Riskiest assumption: we can match streaming quality.

## Option B: keep the third-party client
Riskiest assumption: the vendor keeps the connector free.

## Option C: do nothing for a quarter
Riskiest assumption: nothing we need breaks meanwhile.

## Pre-mortem
A year on it failed because nobody used it.

## Recommendation
Option B. Confidence: 60%. What would change my mind: the connector becomes paid.
`;

test('options need three alternatives, a do-nothing option, a riskiest assumption each and a pre-mortem', () => {
  assert.deepEqual(lintText('options', OPTIONS, null), []);
  const two = errors(lintText('options', OPTIONS.replace(/## Option C[\s\S]*?(?=## Pre-mortem)/, ''), null));
  assert.match(two, /2 option\(s\) found/);
  assert.match(two, /no "do nothing" option/);
  assert.match(errors(lintText('options', OPTIONS.replace('Riskiest assumption: we can match streaming quality.\n', ''), null)), /"Option A: build our own interface" has no `Riskiest assumption:`/);
  assert.match(errors(lintText('options', OPTIONS.replace(/## Pre-mortem[\s\S]*?(?=## Recommendation)/, ''), null)), /missing section "pre-mortem"/);
});

test('plans and briefs are checked for their required sections', () => {
  const plan = errors(lintText('plan', '# Plan\n## Outcome\nx\n## Milestones\ny\n', null));
  for (const part of ['non-goals', 'riskiest assumption', 'metrics', 'kill criteria']) assert.match(plan, new RegExp(`missing section "${part}"`));
  assert.doesNotMatch(plan, /"outcome"/);
  assert.match(errors(lintText('brief', '## Questions\n', null)), /no `Decision:` line/);
});

test('files outside a research run cannot be linted against a ledger', () => {
  const box = sandbox();
  seededRun(box);
  box.write('docs/research/other.md', '# Other\n');
  assert.match(box.pmr(['lint', 'docs/research/other.md']).err, /not part of a research run/);
  box.write(`${WORK}/chat-ui/notes.md`, 'Scratch note citing [C-001] and [E-404].\n');
  assert.match(box.pmr(['lint', `${WORK}/chat-ui/notes.md`]).out, /E-404 is cited but is not in the evidence ledger/);
});
