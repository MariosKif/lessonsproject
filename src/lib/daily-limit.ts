import { sqlite } from "@/db";

/** Distinct non-preview lessons a free account may open per UTC day. */
export const FREE_DAILY_LIMIT = 10;

export type DailyAccess = {
  allowed: boolean;
  /** Distinct metered lessons opened today (after this view, if it was allowed). */
  used: number;
  limit: number;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Metered free tier. Subscribers and free-preview lessons bypass the meter.
 * A lesson already opened today never re-counts, so revisiting is always free.
 * Records the view when it grants access to a new metered lesson.
 */
export function checkDailyAccess(
  userId: string,
  lessonSlug: string,
  opts: { isFree: boolean; isSubscribed: boolean }
): DailyAccess {
  const day = today();
  const usedNow = () =>
    (
      sqlite
        .prepare(`SELECT COUNT(*) AS c FROM daily_lesson_views WHERE user_id = ? AND day = ?`)
        .get(userId, day) as { c: number }
    ).c;

  if (opts.isSubscribed || opts.isFree) {
    return { allowed: true, used: usedNow(), limit: FREE_DAILY_LIMIT };
  }

  const alreadyViewed = sqlite
    .prepare(`SELECT 1 FROM daily_lesson_views WHERE user_id = ? AND lesson_slug = ? AND day = ?`)
    .get(userId, lessonSlug, day);
  if (alreadyViewed) {
    return { allowed: true, used: usedNow(), limit: FREE_DAILY_LIMIT };
  }

  const used = usedNow();
  if (used >= FREE_DAILY_LIMIT) {
    return { allowed: false, used, limit: FREE_DAILY_LIMIT };
  }

  sqlite
    .prepare(`INSERT OR IGNORE INTO daily_lesson_views (user_id, lesson_slug, day) VALUES (?, ?, ?)`)
    .run(userId, lessonSlug, day);
  return { allowed: true, used: used + 1, limit: FREE_DAILY_LIMIT };
}
