import { toolMeta } from "@/lib/tool-meta";

export function DifficultyBadge({ level }: { level: string }) {
  const filled = level === "beginner" ? 1 : level === "intermediate" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft" title={level}>
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: i <= filled ? "var(--ultramarine)" : "var(--mist)" }}
          />
        ))}
      </span>
      <span className="capitalize">{level}</span>
    </span>
  );
}

export function ToolChip({ slug, small = false }: { slug: string; small?: boolean }) {
  const t = toolMeta(slug);
  const isTechnology = t.type === "technology";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-mist bg-sheet ${
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-medium text-ink`}
      title={isTechnology ? `${t.name} — technology course` : `${t.name} — AI tool`}
    >
      {/* Round dot = AI tool, square dot = technology course */}
      <span
        className={`h-2 w-2 ${isTechnology ? "rounded-[3px]" : "rounded-full"}`}
        style={{ background: t.color }}
        aria-hidden
      />
      {t.name}
    </span>
  );
}

export function FreeBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-spark/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-spark">
      Free
    </span>
  );
}

export function CompletedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-0.5 text-[11px] font-semibold text-moss">
      ✓ Done
    </span>
  );
}
