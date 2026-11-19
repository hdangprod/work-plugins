import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { GOOD_REPORT, PLUGIN, REPORT, WORK, sandbox, seededRun } from './helpers.mjs';

const BODY = `## Problem
Prices keep being quoted from review blogs (L-001, hit twice).

## Change
\`\`\`diff
--- a/skills/deep-research/SKILL.md
+++ b/skills/deep-research/SKILL.md
@@
+- Quote a price only from the vendor's own pricing page.
\`\`\`
`;
function withLesson(box) {
  box.ok(['lesson', 'add', '--trigger', 'quoting a price', '--rule', 'open the official pricing page', '--skill', 'deep-research']);
  box.ok(['lesson', 'hit', 'L-001']);
}
const propose = (box, extra = [], input = BODY) => box.pmr(['proposal', 'add', '--title', 'Quote prices from pricing pages only', '--lessons', 'L-001', '--targets', 'skills/deep-research/SKILL.md', '--expect', 'no refuted price claims in the next 3 runs', '--check-by', '2026-12-20', '--stdin', ...extra], { input });
const guard = (box, file, env = {}) => box.hook('guard', { tool_name: 'Edit', tool_input: { file_path: file } }, { env });

test('a proposal needs lessons that exist, plugin-relative targets, a future check date and an exact diff', () => {
  const box = sandbox();
  assert.match(propose(box).err, /Lesson L-001 does not exist/);
  withLesson(box);
  assert.match(propose(box, [], 'Make the skill better.').err, /fenced ```diff block/);
  assert.match(propose(box, ['--targets', '../other/SKILL.md']).err, /relative to its root/);
  assert.match(propose(box, ['--check-by', '2026-11-19']).err, /future date/);
  assert.match(propose(box).out, /wrote P-001 \(pending\).*approve P-001/s);
  assert.match(box.ok(['proposal', 'list']), /P-001 \[pending\] Quote prices from pricing pages only · targets: skills\/deep-research\/SKILL\.md · check by 2026-12-20/);
  assert.match(box.ok(['proposal', 'show', 'P-001']), /expected_effect: no refuted price claims/);
  assert.match(box.ok(['brief']), /proposals waiting for the owner: P-001/);
});

test('the agent cannot approve its own proposal from a non-interactive shell', () => {
  const box = sandbox();
  withLesson(box);
  propose(box);
  const r = box.pmr(['proposal', 'approve', 'P-001']);
  assert.equal(r.code, 1);
  assert.match(r.err, /Only the owner approves/);
  assert.match(box.pmr(['proposal', 'applied', 'P-001', '--note', 'abc123']).err, /P-001 is pending; this step needs a proposal that is approved/);
});

test('plugin source is locked until the owner approves a proposal that targets the file', () => {
  const box = sandbox();
  withLesson(box);
  propose(box);
  const skill = join(PLUGIN, 'skills', 'deep-research', 'SKILL.md');
  const blocked = guard(box, skill);
  assert.equal(blocked.code, 2);
  assert.match(blocked.err, /not a target of an approved proposal/);
  assert.equal(guard(box, skill, { PMR_DEV: '1' }).code, 0, 'a plugin developer opts out explicitly');

  assert.equal(box.hook('approve', { prompt: 'looks good, maybe approve P-001 later' }).out, '', 'only a prompt that starts with the decision counts');
  assert.match(box.hook('approve', { prompt: 'duyệt P-001' }).out, /owner approved P-001/);
  assert.equal(guard(box, skill).code, 0);
  assert.equal(guard(box, join(PLUGIN, 'CHANGELOG.md')).code, 0);
  assert.equal(guard(box, join(PLUGIN, 'skills', 'pm', 'SKILL.md')).code, 2, 'approval covers only the listed targets');
  assert.match(box.ok(['brief']), /approved and not yet applied: P-001/);

  assert.match(box.pmr(['proposal', 'applied', 'P-001']).err, /--note/);
  box.ok(['proposal', 'applied', 'P-001', '--note', 'branch p-001, commit abc123']);
  assert.equal(guard(box, skill).code, 2, 'the lock returns once the change is applied');
  assert.match(box.ok(['audit'], { today: '2026-12-20' }), /P-001 reached its check date \(2026-12-20\)/);
  box.ok(['proposal', 'rollback', 'P-001', '--note', 'price claims were still refuted in 2 of 3 runs'], { today: '2026-12-21' });
  assert.match(box.ok(['proposal', 'show', 'P-001']), /status: rolled-back[\s\S]*rolled-back_note: price claims were still refuted/);
});

test('the owner can reject a proposal by prompt; a second decision is refused', () => {
  const box = sandbox();
  withLesson(box);
  propose(box);
  assert.match(box.hook('approve', { prompt: 'reject P-001 too vague' }).out, /owner rejected P-001/);
  assert.match(box.hook('approve', { prompt: 'approve P-001' }).out, /Could not record the decision: P-001 is rejected, not pending/);
  assert.equal(box.hook('approve', { prompt: 'approve P-009' }).code, 0);
});

test('memory files and ledgers are changed only through pmr', () => {
  const box = sandbox();
  seededRun(box);
  const home = guard(box, join(box.home, 'lessons.md'));
  assert.equal(home.code, 2);
  assert.match(home.err, /changed only through `pmr`/);
  assert.equal(guard(box, join(box.project, WORK, 'chat-ui', 'claims.jsonl')).code, 2);
  assert.equal(guard(box, `${WORK}/chat-ui/evidence.jsonl`).code, 2, 'relative paths resolve against the session directory');
  assert.equal(guard(box, join(box.project, WORK, 'chat-ui', 'brief.md')).code, 0);
  assert.equal(guard(box, join(box.project, REPORT)).code, 0);
  assert.equal(guard(box, join(box.project, 'src', 'claims.jsonl')).code, 0, 'a file with a ledger name outside the work directory is not ours');
  assert.equal(box.pmr(['guard', '--hook'], { input: 'not json' }).code, 0, 'a malformed payload never blocks the session');
});

test('the session brief is silent outside an initialised project and short inside one', () => {
  const bare = sandbox({ init: false });
  const quiet = bare.hook('brief', { session_id: 's-bare', source: 'startup' });
  assert.equal(quiet.code, 0);
  assert.equal(quiet.all, '');

  const box = sandbox();
  seededRun(box);
  const out = box.hook('brief', { session_id: 's1', source: 'startup' }).out;
  assert.match(out, /^\[pm-research\] demo: 1 open research run\(s\)/);
  assert.match(out, /- open run chat-ui: 2 evidence, 3 claims \(2 unverified\)\. Next: finish the brief/);
  assert.ok(out.trim().split('\n').length <= 15);
  assert.doesNotMatch(out, /decision:/);
  assert.match(box.hook('brief', { session_id: 's1', source: 'compact' }).out, /decision: Build our own chat interface/);
});

test('writing a research artefact is linted at once; other files are ignored', () => {
  const box = sandbox();
  seededRun(box);
  box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'supported']);
  const post = (file) => box.hook('lint', { tool_name: 'Write', tool_input: { file_path: file } });
  box.write(REPORT, GOOD_REPORT);
  assert.equal(post(join(box.project, REPORT)).all, '');
  box.write(REPORT, GOOD_REPORT.replace('Confidence: 70%\n', ''));
  const bad = post(join(box.project, REPORT));
  assert.equal(bad.code, 2);
  assert.match(bad.err, /chat-ui-2026-11\.md has issues[\s\S]*Confidence: NN%/);
  box.write('README.md', '# Demo [C-999]\n');
  assert.equal(post(join(box.project, 'README.md')).all, '');
  assert.equal(post(join(box.project, 'missing.md')).code, 0);
});

test('stopping with unverified claims in a run touched this session is flagged once', () => {
  const box = sandbox();
  box.hook('brief', { session_id: 's2', source: 'startup' });
  assert.equal(box.hook('stop', { session_id: 's2' }).out, '', 'nothing was researched in this session');
  seededRun(box);
  const first = JSON.parse(box.hook('stop', { session_id: 's2' }).out);
  assert.equal(first.decision, 'block');
  assert.match(first.reason, /chat-ui: 2 claim\(s\) are still unverified/);
  assert.equal(box.hook('stop', { session_id: 's2' }).out, '', 'the reminder appears once per session');
  assert.equal(box.hook('stop', { session_id: 's3' }).out, '', 'a session that never started with the brief hook is left alone');
});

test('stopping after the report but before the after-action is flagged; a stop hook that is already active is not', () => {
  const box = sandbox();
  box.hook('brief', { session_id: 's4', source: 'startup' });
  seededRun(box);
  box.ok(['claim', 'verify', 'chat-ui', 'C-001', '--verdict', 'supported']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'supported']);
  assert.equal(box.hook('stop', { session_id: 's4' }).out, '', 'verified claims and no report yet: nothing to flag');
  box.write(REPORT, GOOD_REPORT);
  assert.equal(box.hook('stop', { session_id: 's4', stop_hook_active: true }).out, '');
  assert.match(JSON.parse(box.hook('stop', { session_id: 's4' }).out).reason, /no after-action yet/);
});

test('hook entry points refuse to run as plain commands and never throw in hook mode', () => {
  const box = sandbox();
  assert.equal(box.pmr(['guard']).code, 1);
  box.write('.pm-research.json', '{ broken');
  for (const name of ['brief', 'guard', 'lint', 'stop', 'approve']) assert.equal(box.hook(name, { session_id: 's5', prompt: 'approve P-001', tool_input: { file_path: join(box.project, 'x.md') } }).code, 0, name);
  assert.ok(!existsSync(join(box.project, 'x.md')));
  assert.ok(readFileSync(join(box.project, '.pm-research.json'), 'utf8').startsWith('{ broken'));
});
