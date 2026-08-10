import Link from "next/link";
import type { Metadata } from "next";
import { getTools, getToolLessonCounts } from "@/lib/queries/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI tool academies" };

export default function ToolsIndexPage() {
  const tools = getTools({ featuredOnly: true, type: "ai-tool" });
  const counts = getToolLessonCounts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="display text-4xl font-bold">AI tool academies</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        A complete learning area for every major AI tool — from your first session to advanced
        professional workflows. All part of the same €5.99/month subscription.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="group rounded-xl border border-mist bg-sheet p-6 transition-all hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-[0_8px_24px_-12px_rgba(43,58,143,0.25)]"
          >
            <span className="block h-3 w-3 rounded-full" style={{ background: t.color }} />
            <h2 className="display mt-3 text-xl font-semibold group-hover:text-ultramarine">
              {t.name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t.tagline}</p>
            <p className="mt-3 font-mono text-xs text-ink-soft">{counts[t.slug] ?? 0} lessons</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
