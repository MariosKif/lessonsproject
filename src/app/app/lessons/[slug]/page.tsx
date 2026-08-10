import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth/session";
import { getLesson, getRelatedLessons } from "@/lib/queries/lessons";
import { getPathsContainingLesson, getNextLessonInPath, getNextCourse } from "@/lib/queries/paths";
import { getCompletedSlugs, getBookmarkedSlugs, recordView } from "@/lib/queries/user";
import { PromptBlock } from "@/components/prompt-block";
import { QuizBlock } from "@/components/quiz-block";
import { VariationsBlock, FollowUpsBlock } from "@/components/enrichment-blocks";
import { CompleteButton, BookmarkButton } from "@/components/lesson-actions";
import { DifficultyBadge, ToolChip } from "@/components/badges";
import { LessonCard, LessonGrid } from "@/components/lesson-card";
import { CodingLessonView } from "@/components/coding/coding-lesson-view";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-mist pt-6">
      <h2 className="display mb-3 flex items-baseline gap-3 text-lg font-semibold">
        <span className="font-mono text-xs text-ink-soft">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="text-[15px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default async function LessonPage({ params }: PageProps<"/app/lessons/[slug]">) {
  const { slug } = await params;
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  const locked = !lesson.isFree && !ctx.isSubscribed;
  if (!locked) recordView(ctx.user.id, slug);

  const completed = getCompletedSlugs(ctx.user.id).has(slug);
  const bookmarked = getBookmarkedSlugs(ctx.user.id).has(slug);
  const inPaths = getPathsContainingLesson(slug);
  const next = inPaths.length ? getNextLessonInPath(inPaths[0].path.slug, inPaths[0].position) : null;
  // Course chaining: on the last lesson of a path, point to the follow-up course.
  const nextCourse = !next && inPaths.length ? getNextCourse(inPaths[0].path.slug) : null;
  const related = getRelatedLessons(slug);
  const launchTool = lesson.toolTags[0];

  if (lesson.kind === "coding" && lesson.coding && !locked) {
    return (
      <>
        <CodingLessonView
          lesson={{
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary,
            difficulty: lesson.difficulty,
            minutes: lesson.minutes,
            goal: lesson.goal,
            whyItMatters: lesson.whyItMatters,
            commonMistakes: lesson.commonMistakes,
            proTip: lesson.proTip,
            quiz: lesson.quiz,
            coding: lesson.coding,
            toolTags: lesson.toolTags,
          }}
          nav={{
            pathSlug: inPaths[0]?.path.slug,
            pathTitle: inPaths[0]?.path.title,
            nextSlug: next?.lessonSlug,
            nextTitle: next?.title,
            nextCourseSlug: nextCourse?.slug,
            nextCourseTitle: nextCourse?.title,
            completed,
            bookmarked,
          }}
        />
        {related.length > 0 && (
          <section className="mx-auto mt-12 max-w-[1500px]">
            <h2 className="display mb-4 text-lg font-semibold">Related lessons</h2>
            <LessonGrid>
              {related.map((r) => (
                <LessonCard key={r.slug} lesson={r} />
              ))}
            </LessonGrid>
          </section>
        )}
      </>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8">
        {inPaths.length > 0 && (
          <Link
            href={`/app/paths/${inPaths[0].path.slug}`}
            className="mb-3 inline-block text-sm font-medium text-cobalt hover:underline"
          >
            ← {inPaths[0].path.title}
          </Link>
        )}
        <h1 className="display text-3xl font-bold leading-tight">{lesson.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">{lesson.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {lesson.toolTags.map((t) => (
            <ToolChip key={t.slug} slug={t.slug} />
          ))}
          <DifficultyBadge level={lesson.difficulty} />
          <span className="font-mono text-xs text-ink-soft">{lesson.minutes} min</span>
        </div>
      </header>

      {locked ? (
        <div className="rounded-2xl border border-mist bg-sheet p-10 text-center">
          <p className="display text-xl font-semibold">This lesson is part of the full library</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Subscribe for €5.99/month to unlock every lesson, path and academy. You bring your own
            AI accounts — we teach you how to use them well.
          </p>
          <Link
            href="/app/profile#subscription"
            className="mt-6 inline-block rounded-lg bg-ultramarine px-6 py-2.5 text-sm font-semibold text-white hover:bg-cobalt"
          >
            Unlock everything — €5.99/mo
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            let n = 0;
            const next = () => ++n;
            const enr = lesson.enrichment;
            return (
              <>
                <Section n={next()} title="Goal">
                  <p>{lesson.goal}</p>
                </Section>
                <Section n={next()} title="Why it matters">
                  <p className="whitespace-pre-line">{lesson.whyItMatters}</p>
                </Section>
                {lesson.beforeYouStart && (
                  <Section n={next()} title="Before you start">
                    <p className="whitespace-pre-line">{lesson.beforeYouStart}</p>
                  </Section>
                )}
                <Section n={next()} title="Step by step">
                  <ol className="space-y-3">
                    {lesson.steps.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-ultramarine/10 text-center font-mono text-xs leading-6 text-ultramarine">
                          {i + 1}
                        </span>
                        <span className="whitespace-pre-line">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Section>
                <Section n={next()} title={lesson.promptLabel}>
                  <div className="space-y-3">
                    <PromptBlock
                      label={lesson.promptLabel}
                      prompt={lesson.prompt}
                      guide={enr?.placeholders}
                    />
                    {launchTool?.launchUrl && (
                      <a
                        href={launchTool.launchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-mist bg-sheet px-4 py-2 text-sm font-medium text-ink hover:border-cobalt/40"
                      >
                        Open {launchTool.name} in your own account ↗
                      </a>
                    )}
                  </div>
                </Section>
                <Section n={next()} title="Why this works">
                  <p className="whitespace-pre-line">{lesson.explanation}</p>
                </Section>
                {enr?.variations && enr.variations.length > 0 && (
                  <Section n={next()} title="Prompt variations for your situation">
                    <VariationsBlock variations={enr.variations} />
                  </Section>
                )}
                <Section n={next()} title="Example">
                  <div className="whitespace-pre-line rounded-xl border border-mist bg-sheet p-5 text-sm leading-relaxed">
                    {lesson.example}
                  </div>
                </Section>
                {enr?.walkthrough && (
                  <Section n={next()} title="Full walkthrough, start to finish">
                    <div className="whitespace-pre-line rounded-xl border border-moss/25 bg-moss/5 p-5 text-sm leading-relaxed">
                      {enr.walkthrough}
                    </div>
                  </Section>
                )}
                <Section n={next()} title="Try it">
                  <p className="whitespace-pre-line">{lesson.exercise}</p>
                  <p className="mt-3 rounded-lg bg-moss/5 px-4 py-3 text-sm text-moss">
                    <strong>What success looks like:</strong> {lesson.expectedResult}
                  </p>
                </Section>
                {enr?.followUps && enr.followUps.length > 0 && (
                  <Section n={next()} title="Improve the first answer">
                    <FollowUpsBlock followUps={enr.followUps} />
                  </Section>
                )}
                <Section n={next()} title="Common mistakes">
                  <ul className="space-y-2">
                    {lesson.commonMistakes.map((m, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="text-spark">✕</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
                {lesson.proTip && (
                  <Section n={next()} title="Pro tip">
                    <p className="whitespace-pre-line rounded-xl border border-ultramarine/20 bg-ultramarine/5 p-5">
                      {lesson.proTip}
                    </p>
                  </Section>
                )}
                {lesson.quiz && lesson.quiz.length > 0 && (
                  <Section n={next()} title="Check yourself">
                    <QuizBlock questions={lesson.quiz} />
                  </Section>
                )}
              </>
            );
          })()}

          <section className="flex flex-wrap items-center gap-3 border-t border-mist pt-6">
            <CompleteButton slug={slug} completed={completed} />
            <BookmarkButton slug={slug} bookmarked={bookmarked} />
            {next && (
              <Link
                href={`/app/lessons/${next.lessonSlug}`}
                className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-cobalt hover:underline"
              >
                Next: {next.title} →
              </Link>
            )}
          </section>

          {nextCourse && (
            <section className="rounded-2xl border border-ultramarine/25 bg-ultramarine/5 p-6">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
                You reached the end of this course
              </p>
              <h2 className="display mt-2 text-xl font-bold">Keep going: {nextCourse.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{nextCourse.tagline}</p>
              <Link
                href={`/app/paths/${nextCourse.slug}`}
                className="mt-4 inline-block rounded-lg bg-ultramarine px-5 py-2.5 text-sm font-semibold text-white hover:bg-cobalt"
              >
                Continue to the {nextCourse.level} course →
              </Link>
            </section>
          )}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="display mb-4 text-lg font-semibold">Related lessons</h2>
          <LessonGrid>
            {related.map((r) => (
              <LessonCard key={r.slug} lesson={r} />
            ))}
          </LessonGrid>
        </section>
      )}
    </article>
  );
}
