"use client";

import { useMemo, useState } from "react";
import type { PlaceholderGuide } from "@/db/schema";

const PLACEHOLDER_RE = /\[([A-Z][A-Z0-9 ,/&'’-]{2,60})\]/g;

function findPlaceholders(prompt: string): string[] {
  const found = new Set<string>();
  for (const m of prompt.matchAll(PLACEHOLDER_RE)) found.add(m[1]);
  return [...found];
}

export function PromptBlock({
  label,
  prompt,
  guide,
}: {
  label: string;
  prompt: string;
  guide?: PlaceholderGuide[];
}) {
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showFill, setShowFill] = useState(false);

  const placeholders = useMemo(() => findPlaceholders(prompt), [prompt]);
  const guideByName = useMemo(
    () => new Map((guide ?? []).map((g) => [g.name, g])),
    [guide]
  );

  const filledPrompt = useMemo(() => {
    let out = prompt;
    for (const ph of placeholders) {
      const v = values[ph]?.trim();
      if (v) out = out.split(`[${ph}]`).join(v);
    }
    return out;
  }, [prompt, placeholders, values]);

  const filledCount = placeholders.filter((ph) => values[ph]?.trim()).length;

  async function copy() {
    try {
      await navigator.clipboard.writeText(filledPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — select-and-copy still works.
    }
  }

  return (
    <div className="space-y-3">
      {placeholders.length > 0 && (
        <div className="rounded-xl border border-cobalt/25 bg-cobalt/5">
          <button
            onClick={() => setShowFill((s) => !s)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-ultramarine"
            aria-expanded={showFill}
          >
            <span>
              ✍️ Personalize this prompt{" "}
              <span className="font-normal text-ink-soft">
                — fill in {placeholders.length} field{placeholders.length > 1 ? "s" : ""}, with
                examples to guide you
              </span>
            </span>
            <span aria-hidden>{showFill ? "−" : "+"}</span>
          </button>
          {showFill && (
            <div className="space-y-5 border-t border-cobalt/15 px-4 py-4">
              {placeholders.map((ph) => {
                const g = guideByName.get(ph);
                return (
                  <div key={ph}>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {ph.toLowerCase()}
                    </label>
                    {g && (
                      <p className="mb-2 text-sm leading-relaxed text-ink-soft">{g.what}</p>
                    )}
                    <textarea
                      rows={ph.startsWith("PASTE") ? 4 : 2}
                      value={values[ph] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [ph]: e.target.value }))}
                      placeholder={`Your ${ph.toLowerCase()}…`}
                      className="w-full resize-y rounded-lg border border-mist bg-sheet px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-cobalt"
                    />
                    {g && g.examples.length > 0 && (
                      <div className="mt-1.5">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
                          Tap an example to use it as a starting point
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {g.examples.map((ex, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setValues((v) => ({ ...v, [ph]: ex }))}
                              title={ex}
                              className="max-w-full truncate rounded-full border border-mist bg-sheet px-3 py-1 text-left text-xs text-ink transition-colors hover:border-cobalt hover:text-ultramarine"
                            >
                              {ex.length > 70 ? ex.slice(0, 70) + "…" : ex}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-xs text-ink-soft">
                {filledCount}/{placeholders.length} filled — unfilled fields stay as placeholders in
                the copied prompt.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="prompt-surface overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            {label}
            {filledCount > 0 && (
              <span className="ml-2 normal-case tracking-normal text-white/40">· personalized</span>
            )}
          </span>
          <button
            onClick={copy}
            className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            {copied ? "Copied ✓" : "Copy prompt"}
          </button>
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-4 py-4 text-[13px] leading-relaxed">
          {filledPrompt}
        </pre>
      </div>
    </div>
  );
}
