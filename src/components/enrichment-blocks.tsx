"use client";

import { useState } from "react";
import type { PromptVariation, FollowUp } from "@/db/schema";

function CopyButton({ text, dark = false }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — select-and-copy still works.
    }
  }
  return (
    <button
      onClick={copy}
      className={
        dark
          ? "rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
          : "shrink-0 rounded-md border border-mist bg-sheet px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-cobalt/40"
      }
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

/** Alternative prompts for different situations — expandable, each with its own copy button. */
export function VariationsBlock({ variations }: { variations: PromptVariation[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-ink-soft">
        Different situation? Use the variation that matches it — same technique, adapted.
      </p>
      {variations.map((v, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-mist bg-sheet">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={open === i}
          >
            <span>
              <span className="display block text-[15px] font-semibold">{v.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">
                {v.whenToUse}
              </span>
            </span>
            <span aria-hidden className="text-ink-soft">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <div className="prompt-surface">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Variation prompt
                </span>
                <CopyButton text={v.prompt} dark />
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-4 py-3.5 text-[13px] leading-relaxed">
                {v.prompt}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Ready-to-paste follow-up messages for after the AI's first answer. */
export function FollowUpsBlock({ followUps }: { followUps: FollowUp[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-ink-soft">
        The first answer is rarely the best one. Paste one of these into the same conversation to
        sharpen the result:
      </p>
      <ul className="space-y-2">
        {followUps.map((f, i) => (
          <li key={i} className="rounded-xl border border-mist bg-sheet p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="display text-sm font-semibold">{f.label}</p>
              <CopyButton text={f.prompt} />
            </div>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-paper px-3 py-2 font-mono text-xs leading-relaxed text-ink">
              {f.prompt}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
