import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfession } from "@/lib/queries/taxonomy";
import { getLessonCards } from "@/lib/queries/lessons";
import { getPaths } from "@/lib/queries/paths";
import { getCurrentUser } from "@/lib/auth/session";
import { ToolChip, DifficultyBadge, FreeBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/professions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profession = getProfession(slug);
  if (!profession) return {};
  return {
    title: `AI for ${profession.name}s — practical lessons for your daily work`,
    description: `${profession.tagline}. Practical text lessons that map to real ${profession.name.toLowerCase()} tasks, practiced in your own AI accounts.`,
    openGraph: { title: `AI for ${profession.name}s`, description: profession.tagline },
  };
}

export default async function ProfessionLandingPage({ params }: PageProps<"/professions/[slug]">) {
  const { slug } = await params;
  const profession = getProfession(slug);
  if (!profession) notFound();

  const user = await getCurrentUser();
  const lessons = getLessonCards({ profession: slug });
  const paths = getPaths({ professionSlug: slug });
  const toolSet = [...new Set(lessons.flatMap((l) => l.toolSlugs))];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
        AI for {profession.name}s
      </p>
      <h1 className="display mt-3 max-w-3xl text-4xl font-bold leading-tight">
        {profession.name}: do your best work with AI
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
        {profession.tagline}. Practical lessons that map to your real tasks — no theory, no hype,
        no video. Read, copy the prompt, run it in your own AI account.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link
          href={user ? "/app" : "/signup"}
          className="rounded-lg bg-ultramarine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
        >
          {user ? "Continue in the app" : "Start your path — €5.99/mo"}
        </Link>
        <span className="font-mono text-xs text-ink-soft">{lessons.length} lessons</span>
      </div>

      {toolSet.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Tools you&apos;ll use:
          </span>
          {toolSet.map((t) => (
            <ToolChip key={t} slug={t} small />
          ))}
        </div>
      )}

      {paths.map((p) => (
        <section key={p.slug} className="mt-12">
          <h2 className="display text-2xl font-bold">{p.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{p.description}</p>
        </section>
      ))}

      <ul className="mt-6 divide-y divide-mist rounded-xl border border-mist bg-sheet">
        {lessons.map((l) => (
          <li key={l.slug} className="flex items-center gap-4 px-5 py-3.5">
            <span className="min-w-0 flex-1">
              <span className="display block truncate text-[15px] font-semibold">{l.title}</span>
              <span className="mt-0.5 block truncate text-xs text-ink-soft">{l.summary}</span>
            </span>
            {l.isFree && <FreeBadge />}
            <span className="hidden sm:block">
              <DifficultyBadge level={l.difficulty} />
            </span>
            <Link
              href={user ? `/app/lessons/${l.slug}` : "/signup"}
              className="shrink-0 text-sm font-semibold text-cobalt hover:underline"
            >
              {user ? "Open" : l.isFree ? "Read free" : "Unlock"}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
