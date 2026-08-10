"use client";

import { useTransition } from "react";
import { toggleCompleteAction, toggleBookmarkAction } from "@/lib/actions/learning";

export function CompleteButton({ slug, completed }: { slug: string; completed: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleCompleteAction(slug))}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        completed
          ? "border border-moss/30 bg-moss/10 text-moss hover:bg-moss/15"
          : "bg-ultramarine text-white hover:bg-cobalt"
      }`}
    >
      {completed ? "✓ Completed — undo" : "Mark lesson complete"}
    </button>
  );
}

export function BookmarkButton({ slug, bookmarked }: { slug: string; bookmarked: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => toggleBookmarkAction(slug))}
      disabled={pending}
      title={bookmarked ? "Remove bookmark" : "Save for later"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        bookmarked
          ? "border-spark/40 bg-spark/10 text-spark"
          : "border-mist bg-sheet text-ink-soft hover:border-spark/40 hover:text-spark"
      }`}
    >
      {bookmarked ? "★ Saved" : "☆ Save"}
    </button>
  );
}
