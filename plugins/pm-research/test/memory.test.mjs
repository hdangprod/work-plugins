import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { rankLessons } from '../lib/lessons.mjs';
import { similarity } from '../lib/store.mjs';
import { sandbox, seededRun } from './helpers.mjs';

const lesson = (box, trigger, rule, extra = []) => box.pmr(['lesson', 'add', '--trigger', trigger, '--rule', rule, ...extra]);
const lessonsFile = (box) => readFileSync(join(box.home, 'lessons.md'), 'utf8');

test('a lesson inferred by the agent starts as a candidate; a correction from the owner is active at once', () => {
  const box = sandbox();
  assert.match(lesson(box, 'quoting a price', 'open the official pricing page and copy the sentence', ['--skill', 'deep-research']).out, /added L-001 \(candidate\)/);
  assert.match(lesson(box, 'comparing competitors', 'include the manual workaround as a competitor', ['--source', 'owner']).out, /added L-002 \(active\)/);
  assert.match(lessonsFile(box), /^- L-001 \(2026-11-19, ×1, candidate, deep-research\) quoting a price → open the official pricing page and copy the sentence · enforced by: none$/m);
});

test('a near-duplicate lesson is refused in favour of counting the recurrence', () => {
  const box = sandbox();
  lesson(box, 'quoting a price', 'open the official pricing page and copy the sentence');
  const dup = lesson(box, 'quoting a product price', 'open the official pricing page, copy the sentence');
  assert.equal(dup.code, 1);
  assert.match(dup.err, /looks like L-001.*pmr lesson hit L-001/s);
  assert.equal(lesson(box, 'quoting a product price', 'open the official pricing page, copy the sentence', ['--force']).code, 0);
});

test('a second occurrence activates the lesson and flags it for promotion until something enforces it', () => {
  const box = sandbox();
  lesson(box, 'quoting a price', 'open the official pricing page and copy the sentence');
  const hit = box.ok(['lesson', 'hit', 'L-001']);
  assert.match(hit, /L-001 ×2 \(active\)/);
  assert.match(hit, /promotion candidate/);
  assert.match(box.ok(['audit']), /L-001 recurred ×2 with nothing enforcing it/);
  assert.match(box.ok(['brief']), /lessons that keep recurring with nothing enforcing them: L-001/);
  box.ok(['lesson', 'set', 'L-001', '--enforced-by', 'lib/lint.mjs']);
  assert.doesNotMatch(box.ok(['lesson', 'hit', 'L-001']), /promotion candidate/);
  assert.equal(box.ok(['audit']).trim(), 'audit clean');
});

test('lessons are one line and cannot break the file format', () => {
  const box = sandbox();
  assert.match(lesson(box, 'x'.repeat(141), 'rule').err, /max 140/);
  assert.match(lesson(box, 'a trigger', 'do this → then that').err, /must not contain/);
  assert.match(lesson(box, 'a trigger', 'a rule', ['--skill', 'Deep Research']).err, /--skill is a skill name/);
});

test('the lesson file has a hard budget', () => {
  const box = sandbox();
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima'];
  let refused = null;
  for (let i = 0; i < 70 && !refused; i++) {
    const r = lesson(box, `${words[i % 12]}${i} situation number${i}`, `${words[(i + 5) % 12]}${i} response unique${i} ${'pad '.repeat(30)}`, ['--force']);
    if (r.code !== 0) refused = r;
  }
  assert.ok(refused, 'the budget must stop growth');
  assert.match(refused.err, /Lesson budget reached/);
  assert.ok(Buffer.byteLength(lessonsFile(box)) <= 8192);
});

test('shared memory refuses text that contains a private term of the project', () => {
  const box = sandbox();
  box.config({ private_terms: ['Project Nightingale'] });
  const r = lesson(box, 'researching for project nightingale', 'check the vendor docs first');
  assert.equal(r.code, 1);
  assert.match(r.err, /private term #1/);
  assert.doesNotMatch(r.err, /nightingale/i, 'the refusal must not echo the term');
  assert.equal(box.pmr(['mistake', 'add', '--what', 'Leaked Project Nightingale pricing into a lesson']).code, 1);
  assert.equal(box.pmr(['predict', 'add', '--text', 'Project Nightingale ships', '--p', '0.5', '--due', '2027-01-01']).code, 1);
});

test('mistakes point at similar lessons and are linked when distilled', () => {
  const box = sandbox();
  const first = box.ok(['mistake', 'add', '--what', 'Quoted a price from a review blog instead of the pricing page', '--skill', 'deep-research', '--source', 'owner']);
  assert.match(first, /logged M-001/);
  assert.match(first, /pmr lesson add .* --source owner --from M-001/);
  lesson(box, 'quoting a price', 'open the official pricing page, never a review blog', ['--from', 'M-001']);
  assert.match(box.ok(['mistake', 'list']), /M-001 .* → L-001/);
  const second = box.ok(['mistake', 'add', '--what', 'Quoted a price from a review blog again']);
  assert.match(second, /pmr lesson hit L-001 --from M-002/);
  assert.match(box.ok(['mistake', 'list', '--open']), /^M-002 /);
  box.ok(['lesson', 'hit', 'L-001', '--from', 'M-002']);
  assert.match(box.ok(['mistake', 'list', '--open']), /no mistakes waiting/);
});

test('recall ranks by skill and topic words, limits the result and records usage', () => {
  const box = sandbox();
  lesson(box, 'quoting a price', 'open the official pricing page', ['--skill', 'deep-research']);
  lesson(box, 'sizing a market', 'state the unit and the year of every number', ['--skill', 'market-map']);
  lesson(box, 'writing any recommendation', 'say what would change the conclusion');
  const out = box.ok(['recall', '--skill', 'deep-research', '--topic', 'pricing of chat clients', '--limit', '2']);
  assert.match(out, /Lessons to apply \(2 of 3\)/);
  assert.match(out, /- L-001 .*\n- L-003 /);
  assert.doesNotMatch(out, /L-002/);
  const usage = JSON.parse(readFileSync(join(box.home, 'usage.json'), 'utf8'));
  assert.deepEqual(Object.keys(usage), ['L-001', 'L-003']);
  assert.match(box.ok(['recall', '--skill', 'voice-of-customer', '--topic', 'zebra']), /L-003/);
});

test('rankLessons drops lessons that match neither the skill nor the topic', () => {
  const lessons = [
    { id: 'L-001', hits: 1, status: 'active', skill: 'market-map', trigger: 'sizing a market', rule: 'state the unit' },
    { id: 'L-002', hits: 4, status: 'active', skill: 'red-team', trigger: 'reviewing a plan', rule: 'attack the riskiest assumption' },
  ];
  assert.deepEqual(rankLessons(lessons, 'deep-research', 'market size of note apps').map((l) => l.id), ['L-001']);
  assert.ok(similarity('open the official pricing page', 'open the official pricing page first') > 0.5);
  assert.equal(similarity('alpha bravo', 'charlie delta'), 0);
});

test('recall points at earlier work in the project and at domains that failed verification', () => {
  const box = sandbox();
  seededRun(box);
  box.write('docs/research/chat-clients-2026-10.md', '# Chat clients\n\nverified: 2026-10-01 · refresh_after: 2026-11-01 · method: desk\n');
  box.ok(['claim', 'add', 'chat-ui', '--text', 'Second forum claim', '--sources', 'E-002']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-002', '--verdict', 'refuted']);
  box.ok(['claim', 'verify', 'chat-ui', 'C-004', '--verdict', 'refuted']);
  const out = box.ok(['recall', '--skill', 'deep-research', '--topic', 'chat interface clients']);
  assert.match(out, /- run chat-ui \[open\] \(no report yet\)/);
  assert.match(out, /- note docs\/research\/chat-clients-2026-10\.md/);
  assert.match(out, /often failed verification: forum\.example \(2 refuted, 0 supported\)/);
  const audit = box.ok(['audit']);
  assert.match(audit, /chat-clients-2026-10\.md passed its refresh date \(2026-11-01\)/);
  assert.match(audit, /claims resting on forum\.example failed verification 2 time/);
});

test('retiring keeps history; forgetting removes content and never reuses the id', () => {
  const box = sandbox();
  lesson(box, 'quoting a price', 'open the official pricing page');
  lesson(box, 'sizing a market', 'state the unit and the year of every number');
  assert.match(box.pmr(['lesson', 'retire', 'L-001']).err, /--reason/);
  box.ok(['lesson', 'retire', 'L-001', '--reason', 'enforced by lint now']);
  assert.match(readFileSync(join(box.home, 'retired.md'), 'utf8'), /L-001 .* retired 2026-11-19: enforced by lint now/);
  box.ok(['forget', 'L-002']);
  assert.doesNotMatch(lessonsFile(box), /L-00[12]/);
  assert.match(lesson(box, 'reading a changelog', 'note the date of each entry').out, /added L-003/);
  assert.equal(box.pmr(['forget', 'L-002']).code, 1);
});

test('forgetting evidence is refused while a claim cites it', () => {
  const box = sandbox();
  seededRun(box);
  assert.match(box.pmr(['forget', 'E-001']).err, /--topic/);
  assert.match(box.pmr(['forget', 'E-001', '--topic', 'chat-ui']).err, /cited by C-001/);
  box.ok(['forget', 'C-001', '--topic', 'chat-ui']);
  box.ok(['forget', 'E-001', '--topic', 'chat-ui']);
  assert.match(box.ok(['evidence', 'add', 'chat-ui', '--url', 'https://vendor.example/faq', '--quote', 'Offline mode is not supported.']), /added E-003/);
  assert.match(box.ok(['claim', 'add', 'chat-ui', '--text', 'No offline mode', '--sources', 'E-003']), /added C-004/);
});

test('predictions are resolved later and scored for calibration', () => {
  const box = sandbox();
  const add = (text, p, due = '2026-12-01') => box.pmr(['predict', 'add', '--text', text, '--p', String(p), '--due', due]);
  assert.match(add('x', 1.2).err, /between 0 and 1/);
  assert.match(add('x', 0.5, '2026-11-19').err, /in the future/);
  for (let i = 0; i < 10; i++) assert.equal(add(`statement ${i}`, 0.9).code, 0);
  assert.equal(box.ok(['predict', 'list', '--due']).trim(), 'no predictions');
  const later = { today: '2026-12-02' };
  assert.match(box.ok(['predict', 'list', '--due'], later), /PR-001 90% by 2026-12-01 \[DUE\]/);
  assert.match(box.ok(['audit'], later), /prediction\(s\) due for resolution: PR-001, PR-002/);
  for (let i = 1; i <= 10; i++) box.ok(['predict', 'resolve', `PR-${String(i).padStart(3, '0')}`, '--outcome', i <= 5 ? 'true' : 'false'], later);
  const report = box.ok(['predict', 'report'], later);
  assert.match(report, /10 resolved · Brier 0\.410/);
  assert.match(report, /said 90–99%: 5\/10 came true \(50%\)/);
  assert.match(report, /Overconfident: average stated 90%, actual 50%/);
  assert.match(box.ok(['retro'], later), /Calibration: 10 resolved, Brier 0\.410, stated 90% vs actual 50%/);
  assert.ok(existsSync(join(box.home, 'calibration.jsonl')));
});
