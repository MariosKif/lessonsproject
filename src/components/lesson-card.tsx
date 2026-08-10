import Link from "next/link";
import type { LessonCard as LessonCardData } from "@/lib/queries/lessons";
import { DifficultyBadge, ToolChip, FreeBadge, CompletedBadge } from "./badges";

type Props = {
  lesson: LessonCardData;
  completed?: boolean;
  href?: string;
};

export function LessonCard({ lesson, completed = false, href }: Props) {
  return (
    <Link
      href={href ?? `/app/lessons/${lesson.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-mist bg-sheet p-5 transition-all hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-[0_8px_24px_-12px_rgba(43,58,143,0.25)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="display text-[17px] font-semibold leading-snug text-ink group-hover:text-ultramarine">
          {lesson.title}
        </h3>
        <div className="flex shrink-0 gap-1.5 pt-0.5">
          {lesson.kind === "coding" && (
            <span className="rounded-full bg-ultramarine/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-ultramarine">
              Interactive
            </span>
          )}
          {completed && <CompletedBadge />}
          {!completed && lesson.isFree && <FreeBadge />}
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{lesson.summary}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        {lesson.toolSlugs.slice(0, 2).map((t) => (
          <ToolChip key={t} slug={t} small />
        ))}
        <span className="ml-auto flex items-center gap-3 text-xs text-ink-soft">
          <DifficultyBadge level={lesson.difficulty} />
          <span className="font-mono">{lesson.minutes} min</span>
        </span>
      </div>
    </Link>
  );
}

export function LessonGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
