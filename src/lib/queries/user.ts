import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { progress, bookmarks, recentlyViewed, providerConnections } from "@/db/schema";
import { getLessonCardsBySlugs, type LessonCard } from "./lessons";

export function getCompletedSlugs(userId: string): Set<string> {
  const rows = db.select({ slug: progress.lessonSlug }).from(progress).where(eq(progress.userId, userId)).all();
  return new Set(rows.map((r) => r.slug));
}

export function getCompletedCount(userId: string): number {
  return (
    db.select({ c: sql<number>`count(*)` }).from(progress).where(eq(progress.userId, userId)).get()?.c ?? 0
  );
}

export function getBookmarkedSlugs(userId: string): Set<string> {
  const rows = db.select({ slug: bookmarks.lessonSlug }).from(bookmarks).where(eq(bookmarks.userId, userId)).all();
  return new Set(rows.map((r) => r.slug));
}

export function getBookmarkedLessons(userId: string): LessonCard[] {
  const rows = db
    .select({ slug: bookmarks.lessonSlug })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .all();
  return getLessonCardsBySlugs(rows.map((r) => r.slug));
}

export function getRecentLessons(userId: string, limit = 8): LessonCard[] {
  const rows = db
    .select({ slug: recentlyViewed.lessonSlug })
    .from(recentlyViewed)
    .where(eq(recentlyViewed.userId, userId))
    .orderBy(desc(recentlyViewed.viewedAt))
    .limit(limit)
    .all();
  return getLessonCardsBySlugs(rows.map((r) => r.slug));
}

export function recordView(userId: string, lessonSlug: string) {
  db.insert(recentlyViewed)
    .values({ userId, lessonSlug, viewedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: [recentlyViewed.userId, recentlyViewed.lessonSlug],
      set: { viewedAt: new Date().toISOString() },
    })
    .run();
}

export function getConnections(userId: string) {
  return db.select().from(providerConnections).where(eq(providerConnections.userId, userId)).all();
}
