import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth/session";
import { getTools, getProfessions, getToolLessonCounts } from "@/lib/queries/taxonomy";
import { getPaths, getPathProgress } from "@/lib/queries/paths";
import { getRecentLessons, getCompletedSlugs, getCompletedCount } from "@/lib/queries/user";
import { getLessonCount } from "@/lib/queries/lessons";
import { PathCard } from "@/components/path-card";
import { LessonCard, LessonGrid } from "@/components/lesson-card";
import { professionNames } from "@/lib/tool-meta";

export default async function AppHome() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile?.onboarded) redirect("/onboarding");

  const allPaths = getPaths();
  const progressByPath = getPathProgress(ctx.user.id, allPaths.map((p) => p.slug));
  const completed = getCompletedSlugs(ctx.user.id);
  const recent = getRecentLessons(ctx.user.id, 3);
  const totalLessons = getLessonCount();
  const completedCount = getCompletedCount(ctx.user.id);

  const professionSlug = ctx.profile?.professionSlug ?? null;
  const toolsToLearn = new Set(ctx.profile?.toolsToLearn ?? []);

  // Personalized ordering: profession path first, then chosen tools, then the rest.
  const recommended = [
    ...allPaths.filter((p) => p.professionSlug && p.professionSlug === professionSlug),
    ...allPaths.filter((p) => p.toolSlug && toolsToLearn.has(p.toolSlug)),
  ];
  const recommendedSlugs = new Set(recommended.map((p) => p.slug));
  const started = allPaths.filter(
    (p) => (progressByPath.get(p.slug) ?? 0) > 0 && !recommendedSlugs.has(p.slug)
  );

  const tools = getTools({ featuredOnly: true });
  const toolCounts = getToolLessonCounts();
  const professions = getProfessions();

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">
            {completedCount > 0 ? `Welcome back, ${ctx.user.name.split(" ")[0]}` : `Let's begin, ${ctx.user.name.split(" ")[0]}`}
          </h1>
          <p className="mt-1 text-ink-soft">
            {professionSlug ? `${professionNames.get(professionSlug) ?? ""} · ` : ""}
            {completedCount} of {totalLessons} lessons completed
          </p>
        </div>
        <Link
          href="/app/library"
          className="rounded-lg border border-mist bg-sheet px-4 py-2 text-sm font-medium text-ink hover:border-cobalt/40"
        >
          Search the library →
        </Link>
      </header>

      {recent.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Continue learning</h2>
          <LessonGrid>
            {recent.map((l) => (
              <LessonCard key={l.slug} lesson={l} completed={completed.has(l.slug)} />
            ))}
          </LessonGrid>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <h2 className="display mb-1 text-xl font-semibold">Recommended for you</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Built from your profession, tools and goals.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 6).map((p) => (
              <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
            ))}
          </div>
        </section>
      )}

      {started.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">In progress</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {started.slice(0, 3).map((p) => (
              <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="display mb-4 text-xl font-semibold">Learn by AI tool</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/app/library?tool=${t.slug}`}
              className="group rounded-xl border border-mist bg-sheet p-4 transition-all hover:-translate-y-0.5 hover:border-cobalt/40"
            >
              <span className="mb-2 block h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              <span className="display block text-sm font-semibold group-hover:text-ultramarine">
                {t.name}
              </span>
              <span className="mt-0.5 block font-mono text-xs text-ink-soft">
                {toolCounts[t.slug] ?? 0} lessons
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="display mb-4 text-xl font-semibold">Learn for your profession</h2>
        <div className="flex flex-wrap gap-2">
          {professions.map((p) => (
            <Link
              key={p.slug}
              href={`/app/library?profession=${p.slug}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                p.slug === professionSlug
                  ? "border-ultramarine bg-ultramarine text-white"
                  : "border-mist bg-sheet text-ink-soft hover:border-cobalt/40 hover:text-ink"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
