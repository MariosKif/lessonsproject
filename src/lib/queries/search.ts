import { sqlite } from "@/db";
import { getLessonCardsBySlugs, type LessonCard } from "./lessons";

export type SearchFilters = {
  tool?: string;
  profession?: string;
  skill?: string;
  difficulty?: string;
};

/** Escape user input into an FTS5 prefix query: each term quoted with * suffix. */
function toFtsQuery(q: string): string {
  const terms = q
    .replace(/["'*()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (!terms.length) return "";
  return terms.map((t) => `"${t}"*`).join(" ");
}

export function searchLessons(query: string, filters: SearchFilters = {}, limit = 60): LessonCard[] {
  const fts = toFtsQuery(query);
  let slugs: string[];
  if (fts) {
    try {
      slugs = (
        sqlite
          .prepare("SELECT slug FROM lessons_fts WHERE lessons_fts MATCH ? ORDER BY rank LIMIT ?")
          .all(fts, 200) as { slug: string }[]
      ).map((r) => r.slug);
    } catch {
      slugs = [];
    }
  } else {
    slugs = (sqlite.prepare("SELECT slug FROM lessons ORDER BY title").all() as { slug: string }[]).map(
      (r) => r.slug
    );
  }
  if (!slugs.length) return [];

  const conds: string[] = ["l.slug IN (" + slugs.map(() => "?").join(",") + ")"];
  const params: string[] = [...slugs];
  if (filters.difficulty) {
    conds.push("l.difficulty = ?");
    params.push(filters.difficulty);
  }
  if (filters.tool) {
    conds.push("l.slug IN (SELECT lesson_slug FROM lesson_tools WHERE tool_slug = ?)");
    params.push(filters.tool);
  }
  if (filters.profession) {
    conds.push("l.slug IN (SELECT lesson_slug FROM lesson_professions WHERE profession_slug = ?)");
    params.push(filters.profession);
  }
  if (filters.skill) {
    conds.push("l.slug IN (SELECT lesson_slug FROM lesson_skills WHERE skill_slug = ?)");
    params.push(filters.skill);
  }

  const filtered = (
    sqlite.prepare(`SELECT l.slug FROM lessons l WHERE ${conds.join(" AND ")}`).all(...params) as {
      slug: string;
    }[]
  ).map((r) => r.slug);

  const order = new Map(slugs.map((s, i) => [s, i]));
  filtered.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  return getLessonCardsBySlugs(filtered.slice(0, limit));
}
