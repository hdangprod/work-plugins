/**
 * Shared method memory: mistakes (raw log) and lessons (one line each, under a size budget).
 * Lessons are never rewritten wholesale: every command changes one line. A lesson that keeps recurring without
 * anything enforcing it becomes a promotion candidate for a skill, lint or eval change (see proposals.mjs).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { profileLines } from './profile.mjs';
import { appendJsonl, assertShareable, atomicWrite, clip, ensureGlobal, fail, findProject, forgottenIds, gpath, listRuns, nextId, oneLine, readJson, readJsonl, similarity, today, tokens, writeJsonl } from './store.mjs';

export const MAX_LESSONS = 60;
export const MAX_BYTES = 8192;
const SOURCES = ['owner', 'verifier', 'red-team', 'self'];
const HEADER = '# pm-research lessons\n\nManaged by `pmr lesson …`; one line per lesson. Format: `- L-### (first seen, ×hits, status, skill) trigger → rule · enforced by: <path or none>`.\n\n';
const LINE = /^- (L-\d{3}) \((\d{4}-\d{2}-\d{2}), ×(\d+), (candidate|active), ([a-z-]+)\) (.+?) → (.+) · enforced by: (.+)$/;

const render = (l) => `- ${l.id} (${l.first}, ×${l.hits}, ${l.status}, ${l.skill}) ${l.trigger} → ${l.rule} · enforced by: ${l.enforcedBy}`;
export function loadLessons(env) {
  const file = gpath('lessons.md', env);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').map((line) => LINE.exec(line)).filter(Boolean)
    .map((m) => ({ id: m[1], first: m[2], hits: Number(m[3]), status: m[4], skill: m[5], trigger: m[6], rule: m[7], enforcedBy: m[8] }));
}
function saveLessons(lessons, env) {
  const text = `${HEADER}${lessons.map(render).join('\n')}${lessons.length ? '\n' : ''}`;
  if (lessons.length > MAX_LESSONS || Buffer.byteLength(text) > MAX_BYTES) {
    fail(`Lesson budget reached (${lessons.length}/${MAX_LESSONS} lessons, ${Buffer.byteLength(text)}/${MAX_BYTES} bytes). Retire or merge one first: see \`pmr audit\` for lessons that are never recalled.`);
  }
  ensureGlobal(env);
  atomicWrite(gpath('lessons.md', env), text);
}
function field(value, name, max) {
  const text = oneLine(value);
  if (!text) fail(`Missing --${name}.`);
  if (text.length > max) fail(`--${name} is ${text.length} characters; a lesson is one line (max ${max}).`);
  if (/→|· enforced by:/.test(text)) fail(`--${name} must not contain "→" or "· enforced by:".`);
  return text;
}
function getLesson(lessons, id) { return lessons.find((l) => l.id === id) ?? fail(`No lesson ${id}. See \`pmr lesson list\`.`); }
function allLessonIds(lessons, env) {
  const retired = existsSync(gpath('retired.md', env)) ? readFileSync(gpath('retired.md', env), 'utf8').match(/L-\d{3}/g) ?? [] : [];
  return [...lessons.map((l) => l.id), ...retired, ...forgottenIds(ensureGlobal(env))];
}
function linkMistake(env, mistakeId, lessonId) {
  if (!mistakeId || mistakeId === true) return;
  const file = gpath('mistakes.jsonl', env);
  const rows = readJsonl(file);
  const row = rows.find((r) => r.id === mistakeId) ?? fail(`No mistake ${mistakeId}.`);
  row.lesson = lessonId;
  writeJsonl(file, rows);
}
const promotionHint = (l) => (l.hits >= 2 && l.enforcedBy === 'none' ? `\n${l.id} has recurred ${l.hits} times with nothing enforcing it: promotion candidate. Use the research-retro skill to write a proposal.` : '');

export function lessonAdd({ opt, cwd, env }) {
  const trigger = field(opt.trigger, 'trigger', 140);
  const rule = field(opt.rule, 'rule', 220);
  const skill = oneLine(opt.skill === true ? '' : opt.skill) || 'any';
  if (!/^[a-z-]+$/.test(skill)) fail('--skill is a skill name such as deep-research, or omit it for a lesson that applies everywhere.');
  const source = opt.source ?? 'self';
  if (!SOURCES.includes(source)) fail(`--source must be one of ${SOURCES.join(', ')}.`);
  assertShareable(findProject(cwd), trigger, rule);
  const lessons = loadLessons(env);
  const twin = lessons.map((l) => ({ l, score: similarity(`${l.trigger} ${l.rule}`, `${trigger} ${rule}`) })).sort((a, b) => b.score - a.score)[0];
  if (twin && twin.score >= 0.5 && !opt.force) fail(`This looks like ${twin.l.id} ("${clip(twin.l.rule, 80)}"). Count the recurrence with \`pmr lesson hit ${twin.l.id}\` instead, or pass --force if it really is a different lesson.`);
  // A correction from the owner is trusted at once. A lesson the agent inferred stays a candidate until it recurs.
  const lesson = { id: nextId('L', allLessonIds(lessons, env)), first: today(env), hits: 1, status: source === 'owner' ? 'active' : 'candidate', skill, trigger, rule, enforcedBy: 'none' };
  saveLessons([...lessons, lesson], env);
  linkMistake(env, opt.from, lesson.id);
  console.log(`added ${lesson.id} (${lesson.status})`);
}

export function lessonHit({ pos, opt, env }) {
  const lessons = loadLessons(env);
  const lesson = getLesson(lessons, pos[0]);
  lesson.hits += 1;
  if (lesson.status === 'candidate') lesson.status = 'active';
  saveLessons(lessons, env);
  linkMistake(env, opt.from, lesson.id);
  console.log(`${lesson.id} ×${lesson.hits} (${lesson.status})${promotionHint(lesson)}`);
}

export function lessonSet({ pos, opt, cwd, env }) {
  const lessons = loadLessons(env);
  const lesson = getLesson(lessons, pos[0]);
  if (opt.trigger) lesson.trigger = field(opt.trigger, 'trigger', 140);
  if (opt.rule) lesson.rule = field(opt.rule, 'rule', 220);
  if (opt['enforced-by']) lesson.enforcedBy = field(opt['enforced-by'], 'enforced-by', 120);
  if (opt.status) { if (!['candidate', 'active'].includes(opt.status)) fail('--status is candidate or active. To remove a lesson use `pmr lesson retire`.'); lesson.status = opt.status; }
  assertShareable(findProject(cwd), lesson.trigger, lesson.rule);
  saveLessons(lessons, env);
  console.log(render(lesson).slice(2));
}

export function lessonRetire({ pos, opt, env }) {
  const lessons = loadLessons(env);
  const lesson = getLesson(lessons, pos[0]);
  const reason = oneLine(opt.reason === true ? '' : opt.reason) || fail('Give --reason: why this lesson no longer earns its place.');
  const file = gpath('retired.md', env);
  const previous = existsSync(file) ? readFileSync(file, 'utf8') : '# Retired lessons\n\nHistory only. Nothing here is loaded into a session.\n\n';
  atomicWrite(file, `${previous}${render(lesson)} · retired ${today(env)}: ${reason}\n`);
  saveLessons(lessons.filter((l) => l.id !== lesson.id), env);
  console.log(`retired ${lesson.id}`);
}

export function lessonList({ opt, env }) {
  const lessons = loadLessons(env).filter((l) => (!opt.skill || l.skill === opt.skill || l.skill === 'any') && (!opt.status || l.status === opt.status));
  if (!lessons.length) { console.log('no lessons'); return; }
  for (const l of lessons) console.log(render(l).slice(2));
}

// ---- mistakes ----
export function mistakeAdd({ opt, cwd, env }) {
  const what = oneLine(opt.what === true ? '' : opt.what) || fail('Missing --what: one sentence on what went wrong.');
  const why = oneLine(opt.why === true ? '' : opt.why) || null;
  const source = opt.source ?? 'self';
  if (!SOURCES.includes(source)) fail(`--source must be one of ${SOURCES.join(', ')}.`);
  const project = findProject(cwd);
  assertShareable(project, what, why ?? '');
  const file = gpath('mistakes.jsonl', env);
  const home = ensureGlobal(env);
  const id = nextId('M', [...readJsonl(file).map((r) => r.id), ...forgottenIds(home)]);
  appendJsonl(file, { id, at: today(env), what, why, skill: opt.skill && opt.skill !== true ? opt.skill : null, source, project: project?.name ?? null, topic: opt.topic && opt.topic !== true ? opt.topic : null, lesson: null });
  console.log(`logged ${id}`);
  const near = loadLessons(env).map((l) => ({ l, score: similarity(`${l.trigger} ${l.rule}`, `${what} ${why ?? ''}`) })).filter((x) => x.score >= 0.2).sort((a, b) => b.score - a.score).slice(0, 2);
  if (near.length) { console.log('Similar lessons already exist. If one fits, count the recurrence instead of adding a new lesson:'); for (const { l } of near) console.log(`  pmr lesson hit ${l.id} --from ${id}   # ${clip(l.rule, 90)}`); }
  else console.log(`Distil it: pmr lesson add --trigger "<situation>" --rule "<what to do next time>" --skill <skill> --source ${source} --from ${id}`);
}

export function mistakeList({ opt, env }) {
  const rows = readJsonl(gpath('mistakes.jsonl', env)).filter((r) => (!opt.open || !r.lesson) && (!opt.topic || r.topic === opt.topic));
  if (!rows.length) { console.log(opt.open ? 'no mistakes waiting for a lesson' : 'no mistakes logged'); return; }
  for (const r of rows) console.log(`${r.id} ${r.at} [${r.source}${r.skill ? `, ${r.skill}` : ''}] ${r.what}${r.why ? ` — why: ${r.why}` : ''} → ${r.lesson ?? 'no lesson yet'}`);
}

// ---- recall ----
function noteUsage(env, ids) {
  if (!ids.length) return;
  const file = gpath('usage.json', env);
  const usage = readJson(file, {});
  for (const id of ids) usage[id] = { recalled: (usage[id]?.recalled ?? 0) + 1, last: today(env) };
  atomicWrite(file, `${JSON.stringify(usage, null, 2)}\n`);
}

export function rankLessons(lessons, skill, topic) {
  const words = new Set(tokens(topic));
  return lessons.map((l) => {
    const overlap = tokens(`${l.trigger} ${l.rule}`).filter((t) => words.has(t)).length;
    const skillScore = skill && l.skill === skill ? 3 : l.skill === 'any' ? 1 : 0;
    const relevant = skillScore > 0 || overlap > 0;
    return { l, relevant, score: skillScore + overlap * 2 + (l.status === 'active' ? 1 : 0) + Math.log2(l.hits) };
  }).filter((x) => x.relevant).sort((a, b) => b.score - a.score || a.l.id.localeCompare(b.l.id)).map((x) => x.l);
}

/** Report files with a `refresh_after` date in the past. */
export function staleNotes(project, env) {
  if (!existsSync(project.reportsDir)) return [];
  const now = today(env);
  return readdirSync(project.reportsDir).filter((f) => f.endsWith('.md')).map((f) => {
    const head = readFileSync(join(project.reportsDir, f), 'utf8').split('\n').slice(0, 8).join('\n');
    const m = /refresh_after: (\d{4}-\d{2}-\d{2})/.exec(head);
    return m && m[1] < now ? { file: relative(project.root, join(project.reportsDir, f)), due: m[1] } : null;
  }).filter(Boolean);
}

export function recall({ opt, cwd, env }) {
  const skill = opt.skill && opt.skill !== true ? opt.skill : null;
  const topic = opt.topic && opt.topic !== true ? opt.topic : '';
  const limit = Number(opt.limit ?? 5);
  const project = findProject(cwd);
  for (const line of profileLines(project, env)) console.log(line);
  const all = loadLessons(env);
  const picked = rankLessons(all, skill, topic).slice(0, limit);
  noteUsage(env, picked.map((l) => l.id));
  if (picked.length) {
    console.log(`Lessons to apply (${picked.length} of ${all.length}):`);
    for (const l of picked) console.log(`- ${l.id} [${l.status} ×${l.hits}] ${l.trigger} → ${l.rule}`);
  } else console.log(`No stored lesson matches${skill ? ` skill "${skill}"` : ''}${topic ? ` topic "${topic}"` : ''} (${all.length} stored).`);

  if (!project) return;
  const words = new Set(tokens(topic));
  const prior = listRuns(project).filter((r) => r.topic !== opt.exclude && tokens(`${r.topic} ${r.decision}`).some((t) => words.has(t)));
  const notes = existsSync(project.reportsDir) ? readdirSync(project.reportsDir).filter((f) => f.endsWith('.md') && tokens(f).some((t) => words.has(t)) && !prior.some((r) => r.report.endsWith(f))) : [];
  if (prior.length || notes.length) {
    console.log('Earlier work in this project (read before searching again):');
    for (const r of prior) console.log(`- run ${r.topic} [${r.status}] ${existsSync(join(project.root, r.report)) ? r.report : '(no report yet)'}`);
    for (const f of notes) console.log(`- note ${relative(project.root, join(project.reportsDir, f))}`);
  }
  const weak = readJsonl(gpath('sources.jsonl', env)).filter((s) => s.refuted >= 2 && s.refuted >= s.supported);
  if (weak.length) console.log(`Domains whose claims often failed verification: ${weak.map((s) => `${s.domain} (${s.refuted} refuted, ${s.supported} supported)`).join('; ')}`);
}
