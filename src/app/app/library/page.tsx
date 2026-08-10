import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/auth/session";
import { searchLessons } from "@/lib/queries/search";
import { getTools, getProfessions, getSkills } from "@/lib/queries/taxonomy";
import { getCompletedSlugs } from "@/lib/queries/user";
import { LessonCard, LessonGrid } from "@/components/lesson-card";

export const metadata: Metadata = { title: "Lesson library" };

const selectClass =
  "rounded-lg border border-mist bg-sheet px-3 py-2 text-sm text-ink focus:border-cobalt";

export default async function LibraryPage({ searchParams }: PageProps<"/app/library">) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tool = typeof sp.tool === "string" ? sp.tool : "";
  const profession = typeof sp.profession === "string" ? sp.profession : "";
  const skill = typeof sp.skill === "string" ? sp.skill : "";
  const difficulty = typeof sp.difficulty === "string" ? sp.difficulty : "";
  const done = typeof sp.done === "string" ? sp.done : "";

  let results = searchLessons(q, {
    tool: tool || undefined,
    profession: profession || undefined,
    skill: skill || undefined,
    difficulty: difficulty || undefined,
  });
  const completed = getCompletedSlugs(ctx.user.id);
  if (done === "completed") results = results.filter((l) => completed.has(l.slug));
  if (done === "todo") results = results.filter((l) => !completed.has(l.slug));

  const aiTools = getTools({ featuredOnly: true, type: "ai-tool" });
  const technologies = getTools({ featuredOnly: true, type: "technology" });
  const professions = getProfessions();
  const skills = getSkills();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="display text-3xl font-bold">Lesson library</h1>
      <p className="mt-1 text-ink-soft">
        Search every lesson by task, AI tool, technology, profession or keyword.
      </p>

      <form className="mt-6 space-y-3" action="/app/library" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Try “property listing”, “debug”, “email sequence”…"
          className="w-full rounded-xl border border-mist bg-sheet px-4 py-3 text-base text-ink placeholder:text-ink-soft/60 focus:border-cobalt"
        />
        <div className="flex flex-wrap gap-2">
          <select name="tool" defaultValue={tool} className={selectClass} aria-label="Filter by topic">
            <option value="">All topics</option>
            <optgroup label="AI tools">
              {aiTools.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </optgroup>
            <optgroup label="Technologies">
              {technologies.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </optgroup>
          </select>
          <select name="profession" defaultValue={profession} className={selectClass} aria-label="Filter by profession">
            <option value="">All professions</option>
            {professions.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <select name="skill" defaultValue={skill} className={selectClass} aria-label="Filter by skill">
            <option value="">All skills</option>
            {skills.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <select name="difficulty" defaultValue={difficulty} className={selectClass} aria-label="Filter by difficulty">
            <option value="">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select name="done" defaultValue={done} className={selectClass} aria-label="Filter by completion">
            <option value="">All lessons</option>
            <option value="todo">Not completed</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-ultramarine px-5 py-2 text-sm font-semibold text-white hover:bg-cobalt"
          >
            Filter
          </button>
        </div>
      </form>

      <p className="mt-6 font-mono text-xs text-ink-soft">
        {results.length} lesson{results.length === 1 ? "" : "s"}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-xl border border-mist bg-sheet p-10 text-center text-sm text-ink-soft">
          No lessons match. Try fewer filters or a broader search term.
        </div>
      ) : (
        <div className="mt-4">
          <LessonGrid>
            {results.map((l) => (
              <LessonCard key={l.slug} lesson={l} completed={completed.has(l.slug)} />
            ))}
          </LessonGrid>
        </div>
      )}
    </div>
  );
}
