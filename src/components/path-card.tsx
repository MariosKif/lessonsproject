import Link from "next/link";
import type { PathCard as PathCardData } from "@/lib/queries/paths";
import { toolMeta } from "@/lib/tool-meta";

type Props = {
  path: PathCardData;
  completedCount?: number;
  href?: string;
};

export function PathCard({ path, completedCount = 0, href }: Props) {
  const pct = path.lessonCount ? Math.round((completedCount / path.lessonCount) * 100) : 0;
  const accent = path.toolSlug ? toolMeta(path.toolSlug).color : "var(--ultramarine)";
  return (
    <Link
      href={href ?? `/app/paths/${path.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-mist bg-sheet p-5 transition-all hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-[0_8px_24px_-12px_rgba(43,58,143,0.25)]"
    >
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: accent }} aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          {path.kind === "profession" ? "Profession path" : "Course"}
          {path.level && path.level !== "mixed" ? ` · ${path.level}` : ""}
        </span>
      </div>
      <h3 className="display text-lg font-semibold leading-snug text-ink group-hover:text-ultramarine">
        {path.title}
      </h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{path.tagline}</p>
      <div className="mt-auto flex items-center gap-3 pt-1">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? "var(--moss)" : "var(--cobalt)" }}
          />
        </div>
        <span className="font-mono text-xs text-ink-soft">
          {completedCount > 0 ? `${completedCount}/${path.lessonCount}` : `${path.lessonCount} lessons`}
        </span>
      </div>
    </Link>
  );
}
