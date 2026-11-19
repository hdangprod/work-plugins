/** The owner's working style: a shared profile that follows the owner, plus one context file per project. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_RULES } from '../lib/profile.mjs';
import { sandbox } from './helpers.mjs';

const add = (box, area, rule, extra = []) => box.pmr(['profile', 'add', '--area', area, '--rule', rule, ...extra]);
const recall = (box, options) => box.ok(['recall', '--skill', 'pm', '--topic', 'pricing'], options);

test('a rule the agent inferred is observed; one the owner stated is confirmed at once', () => {
  const box = sandbox();
  assert.match(add(box, 'reporting', 'lead with the verdict, then the reasons').out, /added W-001 \(observed\)/);
  assert.match(add(box, 'collaboration', 'give numbered steps for anything the owner must do', ['--source', 'owner']).out, /added W-002 \(confirmed\)/);
  assert.match(box.ok(['profile', 'list']), /W-001 \[observed, reporting\] lead with the verdict/);
  assert.match(box.ok(['profile', 'list', '--status', 'confirmed']), /^W-002 /);
  assert.match(box.ok(['profile', 'confirm', 'W-001']), /W-001 \[confirmed, reporting\]/);
});

test('recall prints confirmed rules as rules and observed ones as defaults to check', () => {
  const box = sandbox();
  add(box, 'reporting', 'lead with the verdict, then the reasons');
  add(box, 'collaboration', 'give numbered steps for anything the owner must do', ['--source', 'owner']);
  const out = recall(box);
  assert.match(out, /confirmed by the owner; follow these\):\n- W-002 \[collaboration\]/);
  assert.match(out, /Observed, not yet confirmed .*:\n- W-001 \[reporting\]/);
  assert.ok(out.indexOf('W-002') < out.indexOf('No stored lesson'), 'the profile comes before the lessons');
});

test('an unconfirmed rule is raised in the session brief and the audit until the owner settles it', () => {
  const box = sandbox();
  add(box, 'reporting', 'lead with the verdict, then the reasons');
  assert.match(box.ok(['brief']), /not yet confirmed: W-001\. Ask the owner/);
  assert.match(box.ok(['audit']), /not yet confirmed: W-001/);
  box.ok(['profile', 'confirm', 'W-001']);
  assert.equal(box.ok(['audit']).trim(), 'audit clean');
});

test('a rule can be reworded or forgotten, and its id is never reused', () => {
  const box = sandbox();
  add(box, 'reporting', 'lead with the verdict, then the reasons');
  assert.match(box.ok(['profile', 'set', 'W-001', '--rule', 'verdict first, in one sentence', '--area', 'writing']), /W-001 \[observed, writing\] verdict first/);
  assert.match(box.pmr(['profile', 'set', 'W-001']).err, /Nothing to change/);
  assert.match(box.ok(['forget', 'W-001']), /forgot W-001/);
  assert.equal(box.ok(['profile', 'list']).trim(), 'no working-style rules');
  assert.match(add(box, 'planning', 'cut scope before moving a date').out, /added W-002/);
});

test('the profile stays short, free of duplicates and free of project-private terms', () => {
  const box = sandbox();
  box.config({ private_terms: ['Bluebird'] });
  assert.match(add(box, 'reporting', 'mention Bluebird in every summary').err, /private term #1/);
  assert.match(add(box, 'Reporting Style', 'a rule').err, /--area is one short kebab-case word/);
  assert.match(add(box, 'reporting', 'x'.repeat(161)).err, /max 160/);
  assert.match(add(box, 'reporting', 'a rule', ['--source', 'verifier']).err, /--source is owner or self/);
  add(box, 'reporting', 'lead with the verdict, then the reasons');
  assert.match(add(box, 'reporting', 'lead with the verdict and then the reasons').err, /looks like W-001/);
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey'];
  for (const w of words) assert.equal(add(box, 'planning', `${w} ${w}s ${w}ed`).code, 0, w);
  assert.match(add(box, 'planning', 'xray xrays xrayed').err, new RegExp(`Profile budget reached \\(${MAX_RULES} rules\\)`));
});

test('each project adds its own context file, which recall prints after the shared rules', () => {
  const box = sandbox();
  add(box, 'reporting', 'lead with the verdict, then the reasons', ['--source', 'owner']);
  assert.doesNotMatch(recall(box), /Project context/);
  box.config({ context_file: 'docs/research/CONTEXT.md' });
  assert.match(recall(box), /docs\/research\/CONTEXT\.md is named in the config but does not exist yet/);
  box.write('docs/research/CONTEXT.md', '# Context\n\n- One user, not for sale.\n');
  const out = recall(box);
  assert.match(out, /Project context \(docs\/research\/CONTEXT\.md; it overrides the shared rules above where they disagree\):\n# Context\n\n- One user, not for sale\./);
  assert.ok(out.indexOf('W-001') < out.indexOf('Project context'));
  box.write('docs/research/CONTEXT.md', Array.from({ length: 45 }, (_, i) => `line ${i + 1}`).join('\n'));
  const long = recall(box);
  assert.match(long, /line 40\n… 5 more lines in docs\/research\/CONTEXT\.md/);
  assert.doesNotMatch(long, /line 41\n/);
  assert.match(box.ok(['paths']), /project context: docs\/research\/CONTEXT\.md/);
});

test('init can name the context file, and the profile is protected from direct edits like the rest of shared memory', () => {
  const box = sandbox({ init: false });
  box.ok(['init', '--name', 'demo', '--context', 'CONTEXT.md']);
  assert.equal(JSON.parse(box.read('.pm-research.json')).context_file, 'CONTEXT.md');
  const blocked = box.hook('guard', { tool_name: 'Edit', tool_input: { file_path: `${box.home}/profile.jsonl` } });
  assert.equal(blocked.code, 2);
  assert.match(blocked.err, /changed only through `pmr`/);
});
