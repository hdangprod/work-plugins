// Decode blind judgements with the key files and tabulate per case and arm.
// Usage: node tabulate.mjs <judged dir> <key dir> [--moves]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [judgedDir, keyDir, flag] = process.argv.slice(2);
const DIMS = ['grounded', 'answers', 'decision', 'rigour', 'craft', 'economy'];
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f = (x) => (Number.isNaN(x) ? '  - ' : x.toFixed(2));
const totals = {};

for (const name of readdirSync(judgedDir).filter((n) => n.endsWith('.json')).sort()) {
  const judged = JSON.parse(readFileSync(join(judgedDir, name), 'utf8'));
  const key = JSON.parse(readFileSync(join(keyDir, name), 'utf8'));
  const arms = {};
  for (const [label, s] of Object.entries(judged.scores)) {
    const k = key[label];
    if (!k) { console.error(`${name}: label ${label} not in key`); continue; }
    const a = (arms[k.arm] ??= { dims: Object.fromEntries(DIMS.map((d) => [d, []])), ranks: [], words: [], labels: [] });
    for (const d of DIMS) a.dims[d].push(Number(s[d]));
    a.ranks.push(judged.rank.indexOf(label) + 1);
    a.words.push(k.words);
    a.labels.push(label);
  }
  console.log(`\n## ${name.replace('.json', '')}   (rank order: ${judged.rank.map((l) => `${l}=${key[l]?.arm}`).join(' ')})`);
  console.log(`arm        ${DIMS.map((d) => d.slice(0, 8).padEnd(9)).join('')}mean  avgRank  words`);
  for (const [arm, a] of Object.entries(arms).sort()) {
    const dm = DIMS.map((d) => mean(a.dims[d]));
    console.log(`${arm.padEnd(11)}${dm.map((x) => f(x).padEnd(9)).join('')}${f(mean(dm))}  ${f(mean(a.ranks))}     ${Math.round(mean(a.words))}`);
    const t = (totals[arm] ??= { dims: Object.fromEntries(DIMS.map((d) => [d, []])), ranks: [], top: 0, wins: 0 });
    DIMS.forEach((d, i) => t.dims[d].push(dm[i]));
    t.ranks.push(mean(a.ranks));
    if (a.ranks.includes(1)) t.top += 1;
  }
  const best = Object.entries(arms).sort((x, y) => mean(x[1].ranks) - mean(y[1].ranks))[0][0];
  totals[best].wins += 1;
  if (flag === '--moves') {
    const tag = (labels) => labels.map((l) => `${l}:${key[l]?.arm ?? '?'}`).join(',');
    for (const m of judged.best_moves ?? []) console.log(`  + [${tag(m.labels)}] ${m.move}`);
    for (const m of judged.common_failures ?? []) console.log(`  - [${tag(m.labels)}] ${m.failure}`);
  }
}

console.log('\n## All cases');
console.log(`arm        ${DIMS.map((d) => d.slice(0, 8).padEnd(9)).join('')}mean  avgRank  bestAvgRank  hasTop1`);
for (const [arm, t] of Object.entries(totals).sort()) {
  const dm = DIMS.map((d) => mean(t.dims[d]));
  console.log(`${arm.padEnd(11)}${dm.map((x) => f(x).padEnd(9)).join('')}${f(mean(dm))}  ${f(mean(t.ranks))}     ${t.wins}/${t.ranks.length}          ${t.top}/${t.ranks.length}`);
}
