import Link from "next/link";
import type { Metadata } from "next";
import { getTools, getToolLessonCounts } from "@/lib/queries/taxonomy";
import { getPaths } from "@/lib/queries/paths";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Technology courses" };

const COMING_SOON = ["CSS", "JavaScript", "TypeScript", "React", "Python", "SQL", "Git", "Node.js"];

export default function TechnologiesIndexPage() {
  const technologies = getTools({ featuredOnly: true, type: "technology" });
  const counts = getToolLessonCounts();
  const allPaths = getPaths();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
        Technology courses
      </p>
      <h1 className="display mt-3 text-4xl font-bold">
        Learn to code with a live editor in every lesson.
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Complete, no-shortcuts curricula for the technologies behind the web. Full theory on the
        left, a code editor with live preview and instant feedback on the right — you write real
        code from the first lesson. Part of the same €5.99/month subscription.
      </p>

      <div className="mt-10 space-y-6">
        {technologies.map((t) => {
          const techPaths = allPaths.filter((p) => p.toolSlug === t.slug && p.kind === "tool-course");
          return (
            <section key={t.slug} className="rounded-2xl border border-mist bg-sheet p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="block h-3 w-3 rounded-sm" style={{ background: t.color }} />
                <h2 className="display text-2xl font-bold">{t.name}</h2>
                <span className="rounded-full bg-ultramarine/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-ultramarine">
                  Interactive
                </span>
                <span className="ml-auto font-mono text-xs text-ink-soft">
                  {counts[t.slug] ?? 0} lessons
                </span>
              </div>
              <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{t.description}</p>
              {techPaths.length > 0 && (
                <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                  {techPaths.map((p, i) => (
                    <li key={p.slug} className="rounded-xl border border-mist bg-paper p-4">
                      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                        Course {i + 1} · {p.level}
                      </p>
                      <p className="display mt-1 font-semibold leading-snug">{p.title}</p>
                    </li>
                  ))}
                </ol>
              )}
              <Link
                href={`/tools/${t.slug}`}
                className="mt-5 inline-block rounded-lg bg-ultramarine px-5 py-2.5 text-sm font-semibold text-white hover:bg-cobalt"
              >
                Explore the {t.name} curriculum
              </Link>
            </section>
          );
        })}
      </div>

      <section className="mt-10 rounded-2xl border border-mist bg-sheet p-6">
        <h2 className="display text-lg font-semibold">More technologies on the way</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The same interactive format is coming to the rest of the modern stack.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {COMING_SOON.map((name) => (
            <li
              key={name}
              className="rounded-full border border-mist bg-paper px-3.5 py-1.5 text-sm font-medium text-ink-soft"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
