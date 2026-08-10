import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, sqlite } from "@/db";
import {
  lessons, lessonTools, lessonProfessions, lessonSkills, tools, professions, skills,
} from "@/db/schema";

export type LessonCard = {
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  minutes: number;
  isFree: boolean;
  kind: string;
  toolSlugs: string[];
};

export type LessonFilters = {
  tool?: string;
  profession?: string;
  skill?: string;
  difficulty?: string;
  limit?: number;
};

const cardColumns = {
  slug: lessons.slug,
  title: lessons.title,
  summary: lessons.summary,
  difficulty: lessons.difficulty,
  minutes: lessons.minutes,
  isFree: lessons.isFree,
  kind: lessons.kind,
};

function withToolSlugs(rows: Omit<LessonCard, "toolSlugs">[]): LessonCard[] {
  if (!rows.length) return [];
  const slugs = rows.map((r) => r.slug);
  const tags = db
    .select({ lessonSlug: lessonTools.lessonSlug, toolSlug: lessonTools.toolSlug })
    .from(lessonTools)
    .where(inArray(lessonTools.lessonSlug, slugs))
    .all();
  const bySlug = new Map<string, string[]>();
  for (const t of tags) {
    const arr = bySlug.get(t.lessonSlug) ?? [];
    arr.push(t.toolSlug);
    bySlug.set(t.lessonSlug, arr);
  }
  return rows.map((r) => ({ ...r, toolSlugs: bySlug.get(r.slug) ?? [] }));
}

export function getLessonCards(filters: LessonFilters = {}): LessonCard[] {
  const conds = [];
  if (filters.difficulty) conds.push(eq(lessons.difficulty, filters.difficulty));
  if (filters.tool)
    conds.push(
      sql`${lessons.slug} IN (SELECT lesson_slug FROM lesson_tools WHERE tool_slug = ${filters.tool})`
    );
  if (filters.profession)
    conds.push(
      sql`${lessons.slug} IN (SELECT lesson_slug FROM lesson_professions WHERE profession_slug = ${filters.profession})`
    );
  if (filters.skill)
    conds.push(
      sql`${lessons.slug} IN (SELECT lesson_slug FROM lesson_skills WHERE skill_slug = ${filters.skill})`
    );

  const rows = db
    .select(cardColumns)
    .from(lessons)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      sql`CASE ${lessons.difficulty} WHEN 'beginner' THEN 0 WHEN 'intermediate' THEN 1 ELSE 2 END`,
      asc(lessons.title)
    )
    .limit(filters.limit ?? 500)
    .all();
  return withToolSlugs(rows);
}

export function getLessonCardsBySlugs(slugs: string[]): LessonCard[] {
  if (!slugs.length) return [];
  const rows = db.select(cardColumns).from(lessons).where(inArray(lessons.slug, slugs)).all();
  const order = new Map(slugs.map((s, i) => [s, i]));
  rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  return withToolSlugs(rows);
}

export function getLesson(slug: string) {
  const lesson = db.select().from(lessons).where(eq(lessons.slug, slug)).get();
  if (!lesson) return null;
  const toolTags = db
    .select({ slug: tools.slug, name: tools.name, color: tools.color, launchUrl: tools.launchUrl, connectMode: tools.connectMode })
    .from(lessonTools)
    .innerJoin(tools, eq(lessonTools.toolSlug, tools.slug))
    .where(eq(lessonTools.lessonSlug, slug))
    .all();
  const professionTags = db
    .select({ slug: professions.slug, name: professions.name })
    .from(lessonProfessions)
    .innerJoin(professions, eq(lessonProfessions.professionSlug, professions.slug))
    .where(eq(lessonProfessions.lessonSlug, slug))
    .all();
  const skillTags = db
    .select({ slug: skills.slug, name: skills.name })
    .from(lessonSkills)
    .innerJoin(skills, eq(lessonSkills.skillSlug, skills.slug))
    .where(eq(lessonSkills.lessonSlug, slug))
    .all();
  return { ...lesson, toolTags, professionTags, skillTags };
}

/** Related lessons: shared tool or profession tags, same-or-adjacent difficulty first. */
export function getRelatedLessons(slug: string, limit = 4): LessonCard[] {
  const rows = sqlite
    .prepare(
      `SELECT l.slug, l.title, l.summary, l.difficulty, l.minutes, l.is_free AS isFree, l.kind,
        (SELECT COUNT(*) FROM lesson_tools a JOIN lesson_tools b ON a.tool_slug = b.tool_slug
          WHERE a.lesson_slug = ? AND b.lesson_slug = l.slug) +
        (SELECT COUNT(*) FROM lesson_professions a JOIN lesson_professions b ON a.profession_slug = b.profession_slug
          WHERE a.lesson_slug = ? AND b.lesson_slug = l.slug) AS overlap
      FROM lessons l WHERE l.slug != ? AND overlap > 0
      ORDER BY overlap DESC, l.title ASC LIMIT ?`
    )
    .all(slug, slug, slug, limit) as (Omit<LessonCard, "toolSlugs" | "isFree"> & { isFree: number })[];
  return withToolSlugs(rows.map((r) => ({ ...r, isFree: !!r.isFree })));
}

export function getLessonCount(): number {
  return db.select({ c: sql<number>`count(*)` }).from(lessons).get()?.c ?? 0;
}
