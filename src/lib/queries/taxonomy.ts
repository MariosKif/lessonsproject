import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tools, professions, skills, lessonTools, lessonProfessions } from "@/db/schema";

export function getTools(opts?: { featuredOnly?: boolean; type?: "ai-tool" | "technology" }) {
  let rows = db.select().from(tools).orderBy(asc(tools.sortOrder)).all();
  if (opts?.featuredOnly) rows = rows.filter((t) => t.featured);
  if (opts?.type) rows = rows.filter((t) => t.type === opts.type);
  return rows;
}

export function getTool(slug: string) {
  return db.select().from(tools).where(eq(tools.slug, slug)).get() ?? null;
}

export function getProfessions() {
  return db.select().from(professions).orderBy(asc(professions.sortOrder)).all();
}

export function getProfession(slug: string) {
  return db.select().from(professions).where(eq(professions.slug, slug)).get() ?? null;
}

export function getSkills() {
  return db.select().from(skills).all();
}

export function getToolLessonCounts(): Record<string, number> {
  const rows = db
    .select({ slug: lessonTools.toolSlug, count: sql<number>`count(*)` })
    .from(lessonTools)
    .groupBy(lessonTools.toolSlug)
    .all();
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

export function getProfessionLessonCounts(): Record<string, number> {
  const rows = db
    .select({ slug: lessonProfessions.professionSlug, count: sql<number>`count(*)` })
    .from(lessonProfessions)
    .groupBy(lessonProfessions.professionSlug)
    .all();
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}
