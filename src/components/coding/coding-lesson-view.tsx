import Link from "next/link";
import type { CodingData, QuizQuestion } from "@/db/schema";
import { QuizBlock } from "@/components/quiz-block";
import { CompleteButton, BookmarkButton } from "@/components/lesson-actions";
import { DifficultyBadge, ToolChip } from "@/components/badges";
import { CodeSnippet } from "@/components/coding/code-snippet";
import { CodingWorkbench } from "@/components/coding/coding-workbench";

type LessonForView = {
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  minutes: number;
  goal: string;
  whyItMatters: string;
  commonMistakes: string[];
  proTip: string | null;
  quiz: QuizQuestion[] | null;
  coding: CodingData;
  toolTags: { slug: string }[];
};

type NavProps = {
  pathSlug?: string;
  pathTitle?: string;
  nextSlug?: string;
  nextTitle?: string;
  nextCourseSlug?: string;
  nextCourseTitle?: string;
  completed: boolean;
  bookmarked: boolean;
};

/**
 * Two-column interactive coding lesson: full theory on the left, a sticky
 * workbench on the right (editor/preview on top, feedback console below).
 */
export function CodingLessonView({ lesson, nav }: { lesson: LessonForView; nav: NavProps }) {
  const { coding } = lesson;
  return (
    <article className="mx-auto max-w-[1500px]">
      <header className="mb-6">
        {nav.pathSlug && (
          <Link
            href={`/app/paths/${nav.pathSlug}`}
            className="mb-3 inline-block text-sm font-medium text-cobalt hover:underline"
          >
            ← {nav.pathTitle}
          </Link>
        )}
        <h1 className="display text-3xl font-bold leading-tight">{lesson.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">{lesson.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {lesson.toolTags.map((t) => (
            <ToolChip key={t.slug} slug={t.slug} />
          ))}
          <DifficultyBadge level={lesson.difficulty} />
          <span className="font-mono text-xs text-ink-soft">{lesson.minutes} min</span>
          <span className="rounded-full bg-ultramarine/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-ultramarine">
            Interactive
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT: the full lesson */}
        <div className="min-w-0 space-y-8">
          <section className="rounded-2xl border border-mist bg-sheet p-5">
            <p className="text-[15px] leading-relaxed">
              <strong className="display">Goal:</strong> {lesson.goal}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{lesson.whyItMatters}</p>
          </section>

          {coding.sections.map((s, i) => (
            <section key={i} className="border-t border-mist pt-6">
              <h2 className="display mb-3 flex items-baseline gap-3 text-lg font-semibold">
                <span className="font-mono text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                {s.heading}
              </h2>
              <div className="space-y-4 text-[15px] leading-relaxed text-ink">
                <p className="whitespace-pre-line">{s.body}</p>
                {s.code && <CodeSnippet code={s.code} />}
              </div>
            </section>
          ))}

          <section className="border-t border-mist pt-6">
            <h2 className="display mb-3 text-lg font-semibold">Common mistakes</h2>
            <ul className="space-y-2 text-[15px] leading-relaxed">
              {lesson.commonMistakes.map((m, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="text-spark">✕</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          {lesson.proTip && (
            <section className="border-t border-mist pt-6">
              <h2 className="display mb-3 text-lg font-semibold">Pro tip</h2>
              <p className="whitespace-pre-line rounded-xl border border-ultramarine/20 bg-ultramarine/5 p-5 text-[15px] leading-relaxed">
                {lesson.proTip}
              </p>
            </section>
          )}

          {lesson.quiz && lesson.quiz.length > 0 && (
            <section className="border-t border-mist pt-6">
              <h2 className="display mb-3 text-lg font-semibold">Check yourself</h2>
              <QuizBlock questions={lesson.quiz} />
            </section>
          )}

          <section className="flex flex-wrap items-center gap-3 border-t border-mist pt-6">
            <CompleteButton slug={lesson.slug} completed={nav.completed} />
            <BookmarkButton slug={lesson.slug} bookmarked={nav.bookmarked} />
            {nav.nextSlug && (
              <Link
                href={`/app/lessons/${nav.nextSlug}`}
                className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-cobalt hover:underline"
              >
                Next: {nav.nextTitle} →
              </Link>
            )}
          </section>

          {!nav.nextSlug && nav.nextCourseSlug && (
            <section className="rounded-2xl border border-ultramarine/25 bg-ultramarine/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
                You reached the end of this course
              </p>
              <h2 className="display mt-2 text-xl font-bold">Keep going: {nav.nextCourseTitle}</h2>
              <Link
                href={`/app/paths/${nav.nextCourseSlug}`}
                className="mt-4 inline-block rounded-lg bg-ultramarine px-5 py-2.5 text-sm font-semibold text-white hover:bg-cobalt"
              >
                Continue to the next course →
              </Link>
            </section>
          )}
        </div>

        {/* RIGHT: sticky workbench — editor/preview on top, feedback console below */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
            <p className="mb-3 text-sm leading-relaxed text-ink-soft">{coding.intro}</p>
            <div className="h-[70vh] lg:h-[calc(100%-2.5rem)]">
              <CodingWorkbench slug={lesson.slug} coding={coding} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
