import { sqlite } from "@/db";

export type PathProgress = {
  slug: string;
  title: string;
  completed: number;
  total: number;
};

export type ProfileStats = {
  lessonsCompleted: number;
  minutesLearned: number;
  bookmarks: number;
  connections: number;
  quizzesAvailable: number;
  streakDays: number;
  lastCompletedAt: string | null;
  pathProgress: PathProgress[];
};

export function getProfileStats(userId: string): ProfileStats {
  const completedRow = sqlite
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(l.minutes), 0) AS m, MAX(p.completed_at) AS last
       FROM progress p JOIN lessons l ON l.slug = p.lesson_slug WHERE p.user_id = ?`
    )
    .get(userId) as { c: number; m: number; last: string | null };

  const bookmarks = (
    sqlite.prepare(`SELECT COUNT(*) AS c FROM bookmarks WHERE user_id = ?`).get(userId) as { c: number }
  ).c;

  const connections = (
    sqlite
      .prepare(`SELECT COUNT(*) AS c FROM provider_connections WHERE user_id = ? AND status = 'connected'`)
      .get(userId) as { c: number }
  ).c;

  const quizzesAvailable = (
    sqlite.prepare(`SELECT COUNT(*) AS c FROM lessons WHERE quiz IS NOT NULL`).get() as { c: number }
  ).c;

  // Streak: consecutive calendar days (UTC) with at least one completion, counting
  // back from today or yesterday.
  const days = (
    sqlite
      .prepare(
        `SELECT DISTINCT substr(completed_at, 1, 10) AS d FROM progress WHERE user_id = ? ORDER BY d DESC`
      )
      .all(userId) as { d: string }[]
  ).map((r) => r.d);
  let streakDays = 0;
  if (days.length) {
    const today = new Date().toISOString().slice(0, 10);
    const cursor = new Date(today + "T00:00:00Z");
    if (days[0] !== today) cursor.setUTCDate(cursor.getUTCDate() - 1); // allow starting yesterday
    for (const d of days) {
      if (d === cursor.toISOString().slice(0, 10)) {
        streakDays++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else break;
    }
  }

  const pathProgress = sqlite
    .prepare(
      `SELECT pa.slug, pa.title,
        COUNT(pl.lesson_slug) AS total,
        SUM(CASE WHEN pr.lesson_slug IS NOT NULL THEN 1 ELSE 0 END) AS completed
       FROM paths pa
       JOIN path_lessons pl ON pl.path_slug = pa.slug
       LEFT JOIN progress pr ON pr.lesson_slug = pl.lesson_slug AND pr.user_id = ?
       GROUP BY pa.slug
       HAVING completed > 0
       ORDER BY CAST(completed AS REAL) / total DESC, pa.title ASC
       LIMIT 8`
    )
    .all(userId) as PathProgress[];

  return {
    lessonsCompleted: completedRow.c,
    minutesLearned: completedRow.m,
    bookmarks,
    connections,
    quizzesAvailable,
    streakDays,
    lastCompletedAt: completedRow.last,
    pathProgress,
  };
}
