import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTool } from "@/lib/queries/taxonomy";
import { getLessonCards } from "@/lib/queries/lessons";
import { getPaths } from "@/lib/queries/paths";
import { getCurrentUser } from "@/lib/auth/session";
import { DifficultyBadge, FreeBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: `${tool.name} Academy — learn ${tool.name} for real work`,
    description: tool.description,
    openGraph: { title: `${tool.name} Academy`, description: tool.tagline },
  };
}

export default async function ToolLandingPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const user = await getCurrentUser();
  const lessons = getLessonCards({ tool: slug });
  const paths = getPaths({ toolSlug: slug });
  const byLevel = {
    beginner: lessons.filter((l) => l.difficulty === "beginner"),
    intermediate: lessons.filter((l) => l.difficulty === "intermediate"),
    advanced: lessons.filter((l) => l.difficulty === "advanced"),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest" style={{ color: tool.color }}>
        {tool.name} Academy
      </p>
      <h1 className="display mt-3 max-w-3xl text-4xl font-bold leading-tight">
        Master {tool.name} for real work
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{tool.description}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href={user ? "/app" : "/signup"}
          className="rounded-lg bg-ultramarine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
        >
          {user ? "Continue in the app" : `Learn ${tool.name} — €5.99/mo`}
        </Link>
        <span className="self-center font-mono text-xs text-ink-soft">
          {lessons.length} lessons · beginner → advanced
        </span>
      </div>

      {paths.length > 0 && (
        <section className="mt-14">
          <h2 className="display text-2xl font-bold">Structured courses</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {paths.map((p) => (
              <div key={p.slug} className="rounded-xl border border-mist bg-sheet p-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">
                  {p.level}
                </p>
                <h3 className="display mt-1 text-lg font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.tagline}</p>
                <p className="mt-3 font-mono text-xs text-ink-soft">{p.lessonCount} lessons</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(["beginner", "intermediate", "advanced"] as const).map((lvl) =>
        byLevel[lvl].length === 0 ? null : (
          <section key={lvl} className="mt-12">
            <h2 className="display text-xl font-bold capitalize">{lvl}</h2>
            <ul className="mt-4 divide-y divide-mist rounded-xl border border-mist bg-sheet">
              {byLevel[lvl].map((l) => (
                <li key={l.slug} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="display block truncate text-[15px] font-semibold">
                      {l.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">{l.summary}</span>
                  </span>
                  {l.isFree && <FreeBadge />}
                  <span className="hidden sm:block">
                    <DifficultyBadge level={l.difficulty} />
                  </span>
                  <Link
                    href={user ? `/app/lessons/${l.slug}` : `/lessons/${l.slug}`}
                    className="shrink-0 text-sm font-semibold text-cobalt hover:underline"
                  >
                    {user ? "Open" : l.isFree ? "Read free" : "Preview"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </main>
  );
}
