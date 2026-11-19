// Build anonymised judging packs: one markdown file per case holding the prompt and every arm's replies under random
// labels, and a separate key file mapping label -> arm and run. The judge is given the pack only.
// Usage: node blind.mjs <out dir> <key dir> <seed> <arm>=<result.json>[#with|without] ...
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, keyDir, seedText, ...specs] = process.argv.slice(2);
let seed = Number(seedText) >>> 0;
const rand = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const cases = new Map();
for (const spec of specs) {
  const [arm, rest] = spec.split('=');
  const [file, armKey = 'with'] = rest.split('#');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const c of data.cases) {
    const entry = cases.get(c.name) ?? { prompt: c.promptMarkdown, replies: [] };
    (c.arms[armKey] ?? []).forEach((run, i) => {
      const text = (run.graders ?? []).map((g) => g.evidence).find((e) => typeof e === 'string' && e.trim());
      if (text) entry.replies.push({ arm, run: i + 1, text, turns: run.turns, skill: (run.graders ?? []).find((g) => g.name === 'skill-fired')?.passed ?? null });
    });
    cases.set(c.name, entry);
  }
}

mkdirSync(outDir, { recursive: true });
mkdirSync(keyDir, { recursive: true });
for (const [name, entry] of cases) {
  const order = shuffle(entry.replies);
  const labels = shuffle(LETTERS.split('')).slice(0, order.length);
  const body = order.map((r, i) => `\n\n<<<<< REPLY ${labels[i]} (${r.text.split(/\s+/).length} words) >>>>>\n\n${r.text.trim()}\n\n<<<<< END OF REPLY ${labels[i]} >>>>>`).join('');
  const prompt = entry.prompt.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^\s*Use the [\w-]+:[\w-]+ skill for this request\.\s*/, '').trim();
  writeFileSync(join(outDir, `${name}.md`), `# Case: ${name}\n\n## The request every reply was answering\n\n${prompt}\n\n## Replies (${order.length}), in random order${body}\n`);
  writeFileSync(join(keyDir, `${name}.json`), `${JSON.stringify(Object.fromEntries(order.map((r, i) => [labels[i], { arm: r.arm, run: r.run, turns: r.turns, skill: r.skill, words: r.text.split(/\s+/).length }])), null, 2)}\n`);
  console.log(`${name}: ${order.length} replies (${[...new Set(order.map((r) => r.arm))].map((a) => `${a} ${order.filter((r) => r.arm === a).length}`).join(', ')})`);
}
