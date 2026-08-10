import Link from "next/link";
import type { Metadata } from "next";
import { getProfessions, getProfessionLessonCounts } from "@/lib/queries/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI by profession" };

export default function ProfessionsIndexPage() {
  const professions = getProfessions();
  const counts = getProfessionLessonCounts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="display text-4xl font-bold">AI for your profession</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Choose your occupation and get a learning path built around your actual daily work — using
        whichever AI tools fit each task best.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professions.map((p) => (
          <Link
            key={p.slug}
            href={`/professions/${p.slug}`}
            className="group rounded-xl border border-mist bg-sheet p-6 transition-all hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-[0_8px_24px_-12px_rgba(43,58,143,0.25)]"
          >
            <h2 className="display text-lg font-semibold group-hover:text-ultramarine">{p.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.tagline}</p>
            <p className="mt-3 font-mono text-xs text-ink-soft">{counts[p.slug] ?? 0} lessons</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
