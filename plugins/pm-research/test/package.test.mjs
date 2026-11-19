/** The package is consistent with itself: skills, templates, agents, hooks and the CLI agree. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { COMMANDS, HOOKS } from '../lib/cli.mjs';
import { lintText } from '../lib/lint.mjs';
import { PLUGIN, sandbox } from './helpers.mjs';

const read = (...parts) => readFileSync(join(PLUGIN, ...parts), 'utf8');
const skills = readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).sort();
const agents = readdirSync(join(PLUGIN, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const frontmatter = (text) => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  assert.ok(m, 'frontmatter block');
  return Object.fromEntries(m[1].split('\n').map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1).trim()]));
};
const errors = (issues) => issues.filter((i) => i.startsWith('error'));

test('there are twelve skills, each in the open SKILL.md format and short enough to be read in full', () => {
  assert.equal(skills.length, 12);
  for (const skill of skills) {
    const text = read('skills', skill, 'SKILL.md');
    const meta = frontmatter(text);
    assert.deepEqual(Object.keys(meta), ['name', 'description'], `${skill}: only the portable frontmatter fields`);
    assert.equal(meta.name, skill);
    assert.ok(meta.description.length >= 80 && meta.description.length <= 1024, `${skill}: description length ${meta.description.length}`);
    assert.match(meta.description, /\bUse (when|after|at|to)\b/, `${skill}: the description says when to use it`);
    assert.ok(text.split('\n').length <= 150, `${skill}: SKILL.md is over 150 lines`);
    // research-memory is the recall skill itself: it documents the command for any skill.
    assert.match(text, new RegExp(`pmr recall --skill ${skill === 'research-memory' ? '<skill>' : skill} `), `${skill}: starts by recalling lessons`);
  }
});

test('every reference, template and agent a skill points to exists', () => {
  for (const skill of skills) {
    const text = read('skills', skill, 'SKILL.md');
    for (const [, rel] of text.matchAll(/`((?:references|templates)\/[\w.-]+)`/g)) assert.ok(existsSync(join(PLUGIN, 'skills', skill, rel)), `${skill}: ${rel} is missing`);
    for (const [, name] of text.matchAll(/`([a-z-]+)` agents?\b/g)) assert.ok(agents.includes(name), `${skill}: agent ${name} is missing`);
    for (const [, name] of text.matchAll(/→ `([a-z-]+)`/g)) assert.ok(skills.includes(name), `${skill}: routes to unknown skill ${name}`);
  }
  for (const agent of agents) {
    const meta = frontmatter(read('agents', `${agent}.md`));
    assert.equal(meta.name, agent);
    assert.ok(meta.description && meta.tools, `${agent}: description and tools`);
    assert.doesNotMatch(meta.tools, /\b(Write|Edit|Bash)\b/, `${agent}: research agents are read-only`);
  }
});

test('every skill that writes for the owner carries the same reply rule, defined on one page', () => {
  const rule = '**The reply.** Answer first; print only what the evidence can fill; say each thing once; nothing about this plugin or its steps; label your own arithmetic and assumptions; end with the next action. Rules and lengths: ';
  assert.ok(existsSync(join(PLUGIN, 'skills', 'pm', 'references', 'reply.md')), 'skills/pm/references/reply.md is missing');
  // The two housekeeping skills report on memory and on the plugin itself, so the rule about not mentioning them cannot apply.
  for (const skill of skills.filter((s) => !['research-memory', 'research-retro'].includes(s))) {
    const text = read('skills', skill, 'SKILL.md');
    const pointer = skill === 'pm' ? '`references/reply.md`.' : '`../pm/references/reply.md`.';
    assert.equal(text.split(rule + pointer).length, 2, `${skill}: the reply rule appears exactly once, word for word`);
  }
});

test('every pmr command named in a skill, reference or agent exists', () => {
  const files = [];
  for (const skill of skills) {
    files.push(['skills', skill, 'SKILL.md']);
    for (const sub of ['references', 'templates']) {
      const dir = join(PLUGIN, 'skills', skill, sub);
      if (existsSync(dir)) for (const f of readdirSync(dir)) files.push(['skills', skill, sub, f]);
    }
  }
  for (const agent of agents) files.push(['agents', `${agent}.md`]);
  const groups = new Set(Object.keys(COMMANDS).filter((k) => k.includes(' ')).map((k) => k.split(' ')[0]));
  let seen = 0;
  for (const parts of files) {
    for (const [, a, b] of read(...parts).matchAll(/\bpmr ([a-z]+)(?: ([a-z-]+))?/g)) {
      seen += 1;
      const ok = groups.has(a) ? Boolean(COMMANDS[`${a} ${b}`]) : Boolean(COMMANDS[a] || HOOKS[a] || a === 'help');
      assert.ok(ok, `${parts.join('/')}: \`pmr ${a}${b ? ` ${b}` : ''}\` is not a command`);
    }
  }
  assert.ok(seen > 60, `expected many command mentions, saw ${seen}`);
});

test('the shipped templates satisfy the lint rules for their kind once filled in', () => {
  const filled = (skill, name) => read('skills', skill, 'templates', name).replace(/Confidence: (TODO|NN)%/, 'Confidence: 60%');
  assert.deepEqual(errors(lintText('options', filled('strategy-options', 'options.md'), null)), []);
  assert.deepEqual(errors(lintText('plan', filled('product-plan', 'plan.md'), null)), []);
  assert.deepEqual(errors(lintText('brief', filled('research-plan', 'brief.md').replace(/\{\{\w+\}\}/g, 'x'), null)), []);
  assert.deepEqual(errors(lintText('after-action', filled('research-retro', 'after-action.md'), null)), []);
  const report = filled('deep-research', 'report.md').replace('verified: YYYY-MM-DD · refresh_after: YYYY-MM-DD', 'verified: 2026-11-19 · refresh_after: 2027-01-18');
  assert.deepEqual(errors(lintText('report', report, null)), []);
  // Unfinished templates never pass the strict check that guards `run close`.
  assert.match(errors(lintText('options', filled('strategy-options', 'options.md'), null, { strict: true })).join('\n'), /unfinished `TODO`/);
  assert.match(read('skills', 'research-retro', 'templates', 'proposal.md'), /```diff\n[\s\S]+?```/);
});

test('the hook file calls only hook entry points that exist', () => {
  const { hooks } = JSON.parse(read('hooks', 'hooks.json'));
  const events = Object.keys(hooks).sort();
  assert.deepEqual(events, ['PostToolUse', 'PreToolUse', 'SessionStart', 'Stop', 'UserPromptSubmit']);
  for (const event of events) for (const entry of hooks[event]) for (const h of entry.hooks) {
    const m = /cli\.mjs" (\w+) --hook$/.exec(h.command);
    assert.ok(m && HOOKS[m[1]], `${event}: ${h.command}`);
    assert.match(h.command, /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/lib\/cli\.mjs"/);
  }
});

test('the manifests name the plugin consistently', () => {
  const plugin = JSON.parse(read('.claude-plugin', 'plugin.json'));
  const market = JSON.parse(read('..', '..', '.claude-plugin', 'marketplace.json'));
  assert.equal(plugin.name, 'pm-research');
  assert.deepEqual(market.plugins.map((p) => [p.name, p.source]), [['pm-research', './plugins/pm-research']]);
});

test('a proposal body can be given as a file path', () => {
  const box = sandbox();
  box.ok(['lesson', 'add', '--trigger', 'quoting a price', '--rule', 'take it from the vendor pricing page and record the date', '--skill', 'deep-research']);
  box.write('body.md', '## Change\n```diff\n-old line\n+new line\n```\n');
  const args = ['proposal', 'add', '--title', 'Prices from pricing pages', '--lessons', 'L-001', '--targets', 'skills/deep-research/SKILL.md', '--expect', 'no refuted price claims in three runs', '--check-by', '2026-12-20'];
  assert.match(box.ok([...args, 'body.md']), /wrote P-001 \(pending\)/);
  assert.match(box.ok(['proposal', 'show', 'P-001']), /\+new line/);
  assert.match(box.pmr([...args, 'missing.md']).all, /ENOENT|no such file|not found/i);
});
