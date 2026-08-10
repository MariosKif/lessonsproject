import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth/session";
import { getPath } from "@/lib/queries/paths";
import { getCompletedSlugs } from "@/lib/queries/user";
import { DifficultyBadge, FreeBadge } from "@/components/badges";
import { toolMeta } from "@/lib/tool-meta";

export default async function PathPage({ params }: PageProps<"/app/paths/[slug]">) {
  const { slug } = await params;
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  const path = getPath(slug);
  if (!path) notFound();

  const completed = getCompletedSlugs(ctx.user.id);
  const doneCount = path.lessons.filter((l) => completed.has(l.slug)).length;
  const pct = path.lessons.length ? Math.round((doneCount / path.lessons.length) * 100) : 0;
  const accent = path.toolSlug ? toolMeta(path.toolSlug).color : "var(--ultramarine)";
  const nextLesson = path.lessons.find((l) => !completed.has(l.slug));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/paths" className="text-sm font-medium text-cobalt hover:underline">
        ← All paths
      </Link>
      <header className="mt-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: accent }} aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            {path.kind === "profession" ? "Profession path" : "Course"}
            {path.level && path.level !== "mixed" ? ` · ${path.level}` : ""}
          </span>
        </div>
        <h1 className="display mt-2 text-3xl font-bold">{path.title}</h1>
        <p className="mt-2 leading-relaxed text-ink-soft">{path.description}</p>
        {path.outcomes && path.outcomes.length > 0 && (
          <div className="mt-5 rounded-xl border border-mist bg-sheet p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              After this {path.kind === "profession" ? "path" : "course"} you can
            </p>
            <ul className="mt-2.5 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {path.outcomes.map((o) => (
                <li key={o} className="flex gap-2">
                  <span aria-hidden className="text-moss">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: pct === 100 ? "var(--moss)" : "var(--cobalt)" }}
            />
          </div>
          <span className="font-mono text-sm text-ink-soft">
            {doneCount}/{path.lessons.length}
          </span>
          {nextLesson && (
            <Link
              href={`/app/lessons/${nextLesson.slug}`}
              className="rounded-lg bg-ultramarine px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt"
            >
              {doneCount > 0 ? "Continue" : "Start"} →
            </Link>
          )}
        </div>
      </header>

      <ol className="mt-8 space-y-2">
        {path.lessons.map((l) => {
          const done = completed.has(l.slug);
          return (
            <li key={l.slug}>
              <Link
                href={`/app/lessons/${l.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-mist bg-sheet px-4 py-3.5 transition-colors hover:border-cobalt/40"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                    done ? "bg-moss text-white" : "bg-mist text-ink-soft"
                  }`}
                >
                  {done ? "✓" : l.position}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`display block truncate text-[15px] font-semibold ${done ? "text-ink-soft line-through decoration-mist" : "text-ink group-hover:text-ultramarine"}`}>
                    {l.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-3 text-xs text-ink-soft">
                    <DifficultyBadge level={l.difficulty} />
                    <span className="font-mono">{l.minutes} min</span>
                    {l.kind === "coding" && (
                      <span className="rounded-full bg-ultramarine/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-ultramarine">
                        Interactive
                      </span>
                    )}
                    {l.isFree && !ctx.isSubscribed && <FreeBadge />}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
