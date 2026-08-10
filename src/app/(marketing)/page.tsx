import Link from "next/link";
import { getTools, getProfessions, getToolLessonCounts, getProfessionLessonCounts } from "@/lib/queries/taxonomy";
import { getLessonCount } from "@/lib/queries/lessons";
import { getPaths } from "@/lib/queries/paths";
import { HeroLessonCard } from "@/components/marketing/hero-lesson";
import { TechGrid } from "@/components/marketing/tech-grid";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  const tools = getTools({ featuredOnly: true, type: "ai-tool" });
  const technologies = getTools({ featuredOnly: true, type: "technology" });
  const professions = getProfessions();
  const toolCounts = getToolLessonCounts();
  const professionCounts = getProfessionLessonCounts();
  const lessonCount = getLessonCount();
  const claudeCourses = getPaths({ kind: "tool-course", toolSlug: "claude" });

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
            {lessonCount}+ lessons · {tools.length} AI tools · {technologies.length}{" "}
            {technologies.length === 1 ? "technology" : "technologies"} · {professions.length} professions
          </p>
          <h1 className="display mt-4 text-4xl font-bold leading-[1.1] sm:text-5xl">
            Learn every major AI tool — and the technologies behind them.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">
            Practical text lessons for Claude, ChatGPT, Codex, Gemini, Cursor and more — plus
            interactive coding courses with a built-in editor, starting with HTML. Organized by your
            profession, the skill you need and your level.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-ultramarine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
            >
              Start learning — €5.99/month
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-cobalt hover:underline">
              Free preview lessons →
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            No video. No AI tokens resold. You bring your own AI accounts.
          </p>
        </div>
        <HeroLessonCard />
      </section>

      {/* How it works */}
      <section className="border-y border-mist bg-sheet">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            ["Read the lesson", "Every lesson solves one real work problem in a few minutes of focused text — goal, steps, example, common mistakes."],
            ["Copy the prompt", "Every lesson ships a battle-tested prompt — with fill-in guidance and real examples for every blank, variations for your situation, and ready follow-ups to sharpen the result."],
            ["Run it in your own AI", "Practice in your own Claude, ChatGPT or other account. Your data, your plan, your results — we never sit in the middle."],
          ].map(([title, body], i) => (
            <div key={title}>
              <span className="prompt-surface inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm">
                {i + 1}
              </span>
              <h2 className="display mt-3 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tool academies */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="display text-3xl font-bold">One academy per AI tool</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Complete learning areas for every major tool — all inside the same subscription and the
          same taxonomy.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tools.map((t) => (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="group rounded-xl border border-mist bg-sheet p-5 transition-all hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-[0_8px_24px_-12px_rgba(43,58,143,0.25)]"
            >
              <span className="block h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              <span className="display mt-3 block font-semibold group-hover:text-ultramarine">
                {t.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{t.tagline}</span>
              <span className="mt-2 block font-mono text-xs text-ink-soft">
                {toolCounts[t.slug] ?? 0} lessons
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Claude courses highlight */}
      <section className="border-y border-mist bg-sheet">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display text-3xl font-bold">The Claude track</h2>
              <p className="mt-2 max-w-xl text-ink-soft">
                Three structured courses — Beginner, Intermediate, Advanced — from your first
                conversation to agentic workflows, MCP connectors and your personal AI operating
                system.
              </p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-cobalt hover:underline">
              See the Claude courses →
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {claudeCourses.map((c, i) => (
              <Link
                key={c.slug}
                href="/courses"
                className="group rounded-xl border border-mist bg-paper p-6 transition-all hover:-translate-y-0.5 hover:border-cobalt/40"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">
                  Course {i + 1} · {c.level}
                </span>
                <span className="display mt-2 block text-xl font-semibold group-hover:text-ultramarine">
                  {c.title}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-soft">{c.tagline}</span>
                <span className="mt-3 block font-mono text-xs text-ink-soft">
                  {c.lessonCount} lessons
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Professions */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="display text-3xl font-bold">Made for your profession</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Pick your occupation and see exactly how AI improves your daily work — across whichever
          tools fit each task.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {professions.map((p) => (
            <Link
              key={p.slug}
              href={`/professions/${p.slug}`}
              className="rounded-full border border-mist bg-sheet px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-cobalt/40 hover:text-ultramarine"
            >
              {p.name}
              <span className="ml-2 font-mono text-xs text-ink-soft">
                {professionCounts[p.slug] ?? 0}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon: technology courses */}
      <section className="border-t border-mist bg-sheet">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
            Technology academies
          </p>
          <h2 className="display mt-2 text-3xl font-bold">
            Master the top 40 technologies
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Full courses for the languages, frameworks and tools behind modern software — taught
            the same way: practical text lessons, real code, your own pace. All part of the same
            subscription.
          </p>
          <div className="mt-8">
            <TechGrid />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-mist">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="display text-3xl font-bold sm:text-4xl">
            One subscription. Every AI tool. Your profession.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            €5.99/month for the whole library — thousands of practical lessons as the catalog grows,
            personalized paths, progress tracking and always-current content.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-ultramarine px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
          >
            Create your account
          </Link>
        </div>
      </section>
    </main>
  );
}
