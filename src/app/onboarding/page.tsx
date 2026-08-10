import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/auth/session";
import { getProfessions, getTools } from "@/lib/queries/taxonomy";
import { saveOnboardingAction } from "@/lib/actions/learning";
import { Wordmark } from "@/components/marketing/nav";

export const metadata: Metadata = { title: "Set up your learning" };

const GOALS = [
  ["writing", "Write better, faster"],
  ["research", "Research and analysis"],
  ["communication", "Client communication"],
  ["marketing", "Marketing and content"],
  ["coding", "Build software"],
  ["automation", "Automate my work"],
] as const;

export default async function OnboardingPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const professions = getProfessions();
  const aiTools = getTools({ featuredOnly: true, type: "ai-tool" });
  const technologies = getTools({ featuredOnly: true, type: "technology" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Wordmark className="text-lg" />
      <h1 className="display mt-6 text-3xl font-bold">Let&apos;s shape your learning path</h1>
      <p className="mt-2 text-ink-soft">
        Four quick questions. We use them to build your personalized paths — you can change them
        anytime.
      </p>

      <form action={saveOnboardingAction} className="mt-10 space-y-10">
        <fieldset>
          <legend className="display mb-3 text-lg font-semibold">What do you do?</legend>
          <select
            name="profession"
            defaultValue={ctx.profile?.professionSlug ?? ""}
            className="w-full rounded-lg border border-mist bg-sheet px-3.5 py-2.5 text-sm"
          >
            <option value="">Choose your profession…</option>
            {professions.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend className="display mb-3 text-lg font-semibold">
            Which AI tools do you want to learn?
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {aiTools.map((t) => (
              <label
                key={t.slug}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-mist bg-sheet px-3 py-2.5 text-sm font-medium transition-colors has-checked:border-cobalt has-checked:bg-cobalt/5"
              >
                <input type="checkbox" name="toolsToLearn" value={t.slug} className="accent-[#4353ff]" />
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} aria-hidden />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>

        {technologies.length > 0 && (
          <fieldset>
            <legend className="display mb-3 text-lg font-semibold">
              Any coding technologies? <span className="font-normal text-ink-soft">(interactive courses with a built-in editor)</span>
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {technologies.map((t) => (
                <label
                  key={t.slug}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-mist bg-sheet px-3 py-2.5 text-sm font-medium transition-colors has-checked:border-cobalt has-checked:bg-cobalt/5"
                >
                  <input type="checkbox" name="toolsToLearn" value={t.slug} className="accent-[#4353ff]" />
                  <span className="h-2 w-2 rounded-sm" style={{ background: t.color }} aria-hidden />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="display mb-3 text-lg font-semibold">Your current AI skill level</legend>
          <div className="grid grid-cols-3 gap-2">
            {["beginner", "intermediate", "advanced"].map((lvl) => (
              <label
                key={lvl}
                className="cursor-pointer rounded-lg border border-mist bg-sheet px-3 py-2.5 text-center text-sm font-medium capitalize transition-colors has-checked:border-cobalt has-checked:bg-cobalt/5"
              >
                <input
                  type="radio"
                  name="skillLevel"
                  value={lvl}
                  defaultChecked={lvl === (ctx.profile?.skillLevel ?? "beginner")}
                  className="sr-only"
                />
                {lvl}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="display mb-3 text-lg font-semibold">What do you want AI to do for you?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GOALS.map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-mist bg-sheet px-3 py-2.5 text-sm font-medium transition-colors has-checked:border-cobalt has-checked:bg-cobalt/5"
              >
                <input type="checkbox" name="goals" value={value} className="accent-[#4353ff]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-lg bg-ultramarine py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
        >
          Build my learning path
        </button>
      </form>
    </div>
  );
}
