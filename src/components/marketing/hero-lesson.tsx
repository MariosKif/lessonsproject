import { ToolChip, DifficultyBadge } from "@/components/badges";

/**
 * The hero shows the actual product: a real lesson, rendered as it appears in the app.
 */
export function HeroLessonCard() {
  return (
    <div className="sheet-stack mx-auto w-full max-w-md">
      <div className="rounded-xl border border-mist bg-sheet p-6 shadow-[0_16px_48px_-24px_rgba(23,26,33,0.35)]">
        <div className="flex items-center gap-2.5">
          <ToolChip slug="claude" small />
          <DifficultyBadge level="beginner" />
          <span className="ml-auto font-mono text-xs text-ink-soft">7 min</span>
        </div>
        <h3 className="display mt-3 text-lg font-semibold leading-snug">
          Create a property listing from rough notes with Claude
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Turn unstructured property notes into clear listing copy — while keeping every factual
          claim grounded in your notes.
        </p>
        <div className="prompt-surface mt-4 rounded-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              Copyable prompt
            </span>
            <span className="rounded border border-white/15 px-2 py-0.5 text-[10px] text-white/70">
              Copy
            </span>
          </div>
          <pre className="whitespace-pre-wrap px-3 py-3 text-[11px] leading-relaxed">
{`Turn the notes below into a professional property
listing. Use only facts contained in the notes.
Do not invent amenities, distances or measurements.
Flag any missing information that would materially
improve the listing.

[PASTE NOTES]`}
          </pre>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-lg bg-ultramarine px-4 py-2 text-xs font-semibold text-white">
            Mark lesson complete
          </span>
          <span className="text-xs font-medium text-cobalt">Next lesson →</span>
        </div>
      </div>
    </div>
  );
}
