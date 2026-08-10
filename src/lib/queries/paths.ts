import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { paths, pathLessons, lessons, progress } from "@/db/schema";

export type PathCard = typeof paths.$inferSelect & {
  lessonCount: number;
  completedCount?: number;
};

function lessonCounts(pathSlugs: string[]): Map<string, number> {
  if (!pathSlugs.length) return new Map();
  const rows = db
    .select({ slug: pathLessons.pathSlug, c: sql<number>`count(*)` })
    .from(pathLessons)
    .where(inArray(pathLessons.pathSlug, pathSlugs))
    .groupBy(pathLessons.pathSlug)
    .all();
  return new Map(rows.map((r) => [r.slug, r.c]));
}

export function getPaths(filter?: { kind?: string; toolSlug?: string; professionSlug?: string }): PathCard[] {
  let rows = db.select().from(paths).orderBy(asc(paths.sortOrder), asc(paths.title)).all();
  if (filter?.kind) rows = rows.filter((p) => p.kind === filter.kind);
  if (filter?.toolSlug) rows = rows.filter((p) => p.toolSlug === filter.toolSlug);
  if (filter?.professionSlug) rows = rows.filter((p) => p.professionSlug === filter.professionSlug);
  const counts = lessonCounts(rows.map((p) => p.slug));
  return rows.map((p) => ({ ...p, lessonCount: counts.get(p.slug) ?? 0 }));
}

export function getPath(slug: string) {
  const path = db.select().from(paths).where(eq(paths.slug, slug)).get();
  if (!path) return null;
  const items = db
    .select({
      slug: lessons.slug,
      title: lessons.title,
      summary: lessons.summary,
      difficulty: lessons.difficulty,
      minutes: lessons.minutes,
      isFree: lessons.isFree,
      kind: lessons.kind,
      position: pathLessons.position,
    })
    .from(pathLessons)
    .innerJoin(lessons, eq(pathLessons.lessonSlug, lessons.slug))
    .where(eq(pathLessons.pathSlug, slug))
    .orderBy(asc(pathLessons.position))
    .all();
  return { ...path, lessons: items };
}

/** Which paths contain this lesson (for next/previous navigation). */
export function getPathsContainingLesson(lessonSlug: string) {
  return db
    .select({ path: paths, position: pathLessons.position })
    .from(pathLessons)
    .innerJoin(paths, eq(pathLessons.pathSlug, paths.slug))
    .where(eq(pathLessons.lessonSlug, lessonSlug))
    .orderBy(asc(paths.sortOrder))
    .all();
}

export function getNextLessonInPath(pathSlug: string, position: number) {
  return db
    .select({ lessonSlug: pathLessons.lessonSlug, title: lessons.title, position: pathLessons.position })
    .from(pathLessons)
    .innerJoin(lessons, eq(pathLessons.lessonSlug, lessons.slug))
    .where(sql`${pathLessons.pathSlug} = ${pathSlug} AND ${pathLessons.position} > ${position}`)
    .orderBy(asc(pathLessons.position))
    .limit(1)
    .get() ?? null;
}

export function getPathProgress(userId: string, pathSlugs: string[]): Map<string, number> {
  if (!pathSlugs.length) return new Map();
  const rows = db
    .select({ slug: pathLessons.pathSlug, c: sql<number>`count(*)` })
    .from(pathLessons)
    .innerJoin(progress, eq(pathLessons.lessonSlug, progress.lessonSlug))
    .where(sql`${progress.userId} = ${userId} AND ${inArray(pathLessons.pathSlug, pathSlugs)}`)
    .groupBy(pathLessons.pathSlug)
    .all();
  return new Map(rows.map((r) => [r.slug, r.c]));
}
