/**
 * Generates CURRICULUM.md — the full human-readable catalog — from the seeded database.
 * Run: npx tsx scripts/export-curriculum.ts
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const db = new Database(path.join(process.cwd(), "data", "skillstack.db"));

type PathRow = { slug: string; title: string; tagline: string; kind: string; level: string };
type LessonRow = { slug: string; title: string; summary: string; difficulty: string; minutes: number; is_free: number; position: number };

const paths = db
  .prepare("SELECT slug, title, tagline, kind, level FROM paths ORDER BY CASE kind WHEN 'tool-course' THEN 0 ELSE 1 END, sort_order, title")
  .all() as PathRow[];

const lessonsFor = db.prepare(`
  SELECT l.slug, l.title, l.summary, l.difficulty, l.minutes, l.is_free, pl.position
  FROM path_lessons pl JOIN lessons l ON l.slug = pl.lesson_slug
  WHERE pl.path_slug = ? ORDER BY pl.position
`);

const counts = db.prepare("SELECT COUNT(*) AS c FROM lessons").get() as { c: number };

let out = `# SkillStack — Full Curriculum\n\n`;
out += `Generated from the seeded catalog: **${counts.c} lessons** across ${paths.length} learning paths.\n\n`;
out += `Free-preview lessons are marked 🆓. Difficulty: ● beginner, ●● intermediate, ●●● advanced.\n\n---\n`;

let currentKind = "";
for (const p of paths) {
  if (p.kind !== currentKind) {
    currentKind = p.kind;
    out += `\n# ${currentKind === "tool-course" ? "Tool academies & courses" : "Profession paths"}\n`;
  }
  const lessons = lessonsFor.all(p.slug) as LessonRow[];
  out += `\n## ${p.title}\n\n*${p.tagline}* — ${lessons.length} lessons (${p.level})\n\n`;
  for (const l of lessons) {
    const dots = l.difficulty === "beginner" ? "●" : l.difficulty === "intermediate" ? "●●" : "●●●";
    out += `${l.position}. **${l.title}** ${l.is_free ? "🆓" : ""} — ${dots} ${l.minutes} min\n   ${l.summary}\n`;
  }
}

fs.writeFileSync(path.join(process.cwd(), "CURRICULUM.md"), out);
console.log(`CURRICULUM.md written (${out.length} chars, ${counts.c} lessons).`);
