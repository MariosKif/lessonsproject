import Link from "next/link";
import type { Metadata } from "next";
import { getPath, getPaths } from "@/lib/queries/paths";
import { getTool } from "@/lib/queries/taxonomy";
import { getCurrentUser } from "@/lib/auth/session";
import { FreeBadge } from "@/components/badges";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Courses" };

// Optional marketing copy per track; any topic with 2+ courses gets a track
// automatically, falling back to copy derived from its taxonomy entry.
const TRACK_COPY: Record<string, { label: string; heading: string; blurb: string }> = {
  claude: {
    label: "The Claude track",
    heading: "Three courses. From first prompt to AI operating system.",
    blurb:
      "A complete, structured route through Claude — written for working professionals and kept current as Anthropic ships. Practice everything in your own Claude account.",
  },
  html: {
    label: "The HTML track",
    heading: "Learn HTML from zero to expert — with a live editor in every lesson.",
    blurb:
      "Sixty interactive lessons covering everything HTML has: full theory on the left, a code editor with live preview and instant feedback on the right. No videos, no shortcuts — you write real code from lesson one.",
  },
};

/** Multi-course tracks, derived from the DB: any topic with 2+ tool-course paths. */
function getTracks() {
  const byTool = new Map<string, string[]>();
  for (const p of getPaths()) {
    if (p.kind !== "tool-course" || !p.toolSlug) continue;
    byTool.set(p.toolSlug, [...(byTool.get(p.toolSlug) ?? []), p.slug]);
  }
  const tracks = [];
  for (const [toolSlug, slugs] of byTool) {
    if (slugs.length < 2) continue;
    const tool = getTool(toolSlug);
    if (!tool) continue;
    tracks.push({
      toolSlug,
      type: tool.type,
      slugs,
      ...(TRACK_COPY[toolSlug] ?? {
        label: `The ${tool.name} track`,
        heading: `Master ${tool.name}, course by course.`,
        blurb: tool.description,
      }),
    });
  }
  // AI-tool tracks first, then technologies, stable within each group.
  return tracks.sort((a, b) => (a.type === b.type ? 0 : a.type === "ai-tool" ? -1 : 1));
}

export default async function CoursesPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      {getTracks().map((track, ti) => {
        const courses = track.slugs.map((s) => getPath(s)).filter(
          (c): c is NonNullable<ReturnType<typeof getPath>> => c !== null
        );
        if (!courses.length) return null;
        return (
          <div key={track.label} className={ti > 0 ? "mt-20" : undefined}>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
              {track.label}
            </p>
            <h1 className="display mt-3 text-4xl font-bold leading-tight">{track.heading}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{track.blurb}</p>
            <Link
              href={user ? "/app/paths" : "/signup"}
              className="mt-6 inline-block rounded-lg bg-ultramarine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
            >
              {user ? "Open in the app" : "Start the track — €5.99/mo"}
            </Link>

            <div className="mt-14 space-y-10">
              {courses.map((course, i) => (
          <section key={course.slug} className="rounded-2xl border border-mist bg-sheet p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
              Course {i + 1} · {course.level} · {course.lessons.length} lessons
            </p>
            <h2 className="display mt-2 text-2xl font-bold">{course.title}</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{course.description}</p>
            {course.outcomes && course.outcomes.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  After this course you can
                </p>
                <ul className="mt-2 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex gap-2">
                      <span aria-hidden className="text-moss">✓</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ol className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {course.lessons.map((l) => (
                <li key={l.slug} className="flex items-center gap-3 text-sm">
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-ink-soft">
                    {l.position}.
                  </span>
                  <Link
                    href={user ? `/app/lessons/${l.slug}` : "/signup"}
                    className="min-w-0 flex-1 truncate font-medium text-ink hover:text-ultramarine"
                  >
                    {l.title}
                  </Link>
                  {l.isFree && <FreeBadge />}
                </li>
              ))}
            </ol>
          </section>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}
