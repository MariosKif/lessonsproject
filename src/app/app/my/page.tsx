import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getUserContext } from "@/lib/auth/session";
import { getPaths, getPathProgress } from "@/lib/queries/paths";
import {
  getBookmarkedLessons, getRecentLessons, getCompletedSlugs, getCompletedCount,
} from "@/lib/queries/user";
import { getLessonCount } from "@/lib/queries/lessons";
import { LessonCard, LessonGrid } from "@/components/lesson-card";
import { PathCard } from "@/components/path-card";

export const metadata: Metadata = { title: "My learning" };

export default async function MyLearningPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const completed = getCompletedSlugs(ctx.user.id);
  const completedCount = getCompletedCount(ctx.user.id);
  const total = getLessonCount();
  const recent = getRecentLessons(ctx.user.id, 6);
  const saved = getBookmarkedLessons(ctx.user.id);
  const allPaths = getPaths();
  const progressByPath = getPathProgress(ctx.user.id, allPaths.map((p) => p.slug));
  const inProgress = allPaths.filter((p) => {
    const c = progressByPath.get(p.slug) ?? 0;
    return c > 0 && c < p.lessonCount;
  });
  const finished = allPaths.filter(
    (p) => p.lessonCount > 0 && (progressByPath.get(p.slug) ?? 0) === p.lessonCount
  );

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header>
        <h1 className="display text-3xl font-bold">My learning</h1>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
          {[
            [completedCount, "lessons done"],
            [inProgress.length, "paths in progress"],
            [finished.length, "paths finished"],
          ].map(([n, label]) => (
            <div key={label} className="rounded-xl border border-mist bg-sheet p-4 text-center">
              <span className="display block text-2xl font-bold text-ultramarine">{n}</span>
              <span className="text-xs text-ink-soft">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {total > 0 ? Math.round((completedCount / total) * 100) : 0}% of the whole library
        </p>
      </header>

      {inProgress.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Paths in progress</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((p) => (
              <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Recently viewed</h2>
          <LessonGrid>
            {recent.map((l) => (
              <LessonCard key={l.slug} lesson={l} completed={completed.has(l.slug)} />
            ))}
          </LessonGrid>
        </section>
      )}

      <section>
        <h2 className="display mb-4 text-xl font-semibold">Saved lessons</h2>
        {saved.length === 0 ? (
          <div className="rounded-xl border border-mist bg-sheet p-8 text-center text-sm text-ink-soft">
            Nothing saved yet. Tap “☆ Save” on any lesson to keep it here for later.{" "}
            <Link href="/app/library" className="font-medium text-cobalt hover:underline">
              Browse the library
            </Link>
          </div>
        ) : (
          <LessonGrid>
            {saved.map((l) => (
              <LessonCard key={l.slug} lesson={l} completed={completed.has(l.slug)} />
            ))}
          </LessonGrid>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Completed paths</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finished.map((p) => (
              <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
