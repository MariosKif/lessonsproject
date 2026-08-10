import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLesson } from "@/lib/queries/lessons";
import { getCurrentUser } from "@/lib/auth/session";
import { ToolChip, DifficultyBadge, FreeBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) return {};
  return {
    title: lesson.title,
    description: lesson.summary,
    openGraph: { title: lesson.title, description: lesson.summary, type: "article" },
  };
}

/** Public SEO teaser: goal + context only — the full lesson lives in the app. */
export default async function LessonTeaserPage({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  const user = await getCurrentUser();
  if (user) redirect(`/app/lessons/${slug}`);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
        {lesson.kind === "coding" ? "Interactive lesson" : "Text lesson"} · {lesson.minutes} min
      </p>
      <h1 className="display mt-3 text-4xl font-bold leading-tight">{lesson.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">{lesson.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {lesson.toolTags.map((t) => (
          <ToolChip key={t.slug} slug={t.slug} />
        ))}
        <DifficultyBadge level={lesson.difficulty} />
        {lesson.isFree && <FreeBadge />}
      </div>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="display text-lg font-semibold">What you&apos;ll accomplish</h2>
          <p className="mt-2 leading-relaxed">{lesson.goal}</p>
        </div>
        <div>
          <h2 className="display text-lg font-semibold">Why it matters</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">
            {lesson.whyItMatters}
          </p>
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-mist bg-sheet p-8 text-center">
        <p className="display text-xl font-semibold">
          {lesson.isFree ? "Read this lesson free with an account" : "This lesson is in the full library"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          Step-by-step workflow, a copy-ready prompt with fill-in examples for every blank, prompt
          variations, ready follow-ups, a full walkthrough, common mistakes and a knowledge check —
          practiced in your own AI account.
        </p>
        <Link
          href="/signup"
          className="mt-5 inline-block rounded-lg bg-ultramarine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
        >
          {lesson.isFree ? "Create a free account" : "Start learning — €5.99/mo"}
        </Link>
      </div>
    </main>
  );
}
