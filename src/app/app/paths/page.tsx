import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/auth/session";
import { getPaths, getPathProgress } from "@/lib/queries/paths";
import { PathCard } from "@/components/path-card";
import { toolMeta } from "@/lib/tool-meta";

export const metadata: Metadata = { title: "Learning paths" };

export default async function PathsPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  const all = getPaths();
  const progressByPath = getPathProgress(ctx.user.id, all.map((p) => p.slug));
  const isTechnology = (p: { toolSlug: string | null }) =>
    p.toolSlug !== null && toolMeta(p.toolSlug).type === "technology";
  const courses = all.filter((p) => p.kind === "tool-course" && !isTechnology(p));
  const technologyCourses = all.filter((p) => p.kind === "tool-course" && isTechnology(p));
  const professionPaths = all.filter((p) => p.kind === "profession");

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header>
        <h1 className="display text-3xl font-bold">Learning paths</h1>
        <p className="mt-1 text-ink-soft">
          Ordered lessons that take you from first attempt to confident daily use.
        </p>
      </header>

      <section>
        <h2 className="display mb-4 text-xl font-semibold">AI tool academies &amp; courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((p) => (
            <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
          ))}
        </div>
      </section>

      {technologyCourses.length > 0 && (
        <section>
          <h2 className="display mb-4 text-xl font-semibold">Technology courses</h2>
          <p className="mb-4 -mt-2 text-sm text-ink-soft">
            Interactive coding curricula with the built-in editor — theory on the left, live code on
            the right.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technologyCourses.map((p) => (
              <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="display mb-4 text-xl font-semibold">Profession paths</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionPaths.map((p) => (
            <PathCard key={p.slug} path={p} completedCount={progressByPath.get(p.slug) ?? 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
