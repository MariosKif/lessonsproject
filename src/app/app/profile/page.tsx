import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserContext } from "@/lib/auth/session";
import { getTools, getProfessions } from "@/lib/queries/taxonomy";
import { getConnections } from "@/lib/queries/user";
import { getProfileStats } from "@/lib/queries/profile-stats";
import { subscribeAction, cancelSubscriptionAction } from "@/lib/actions/learning";
import { logoutAction } from "@/lib/auth/actions";
import { toolMeta, skillNames, professionNames } from "@/lib/tool-meta";
import {
  ProfileDetailsForm,
  PasswordForm,
  DeleteAccountForm,
} from "@/components/app/profile-forms";
import { ConnectionsList } from "@/components/app/connections-list";

export const metadata: Metadata = { title: "Your profile" };

const GOAL_LABELS = new Map([
  ["writing", "Write better, faster"],
  ["research", "Research and analysis"],
  ["communication", "Client communication"],
  ["marketing", "Marketing and content"],
  ["coding", "Build software"],
  ["automation", "Automate my work"],
]);

const SECTIONS = [
  ["overview", "Overview"],
  ["details", "Details"],
  ["subscription", "Subscription"],
  ["connections", "AI accounts"],
  ["preferences", "Preferences"],
  ["security", "Security"],
] as const;

function Card({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-mist bg-sheet p-6">
      <h2 className="display text-lg font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-mist bg-paper px-4 py-3">
      <p className="display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export default async function ProfilePage({ searchParams }: PageProps<"/app/profile">) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");
  const sp = await searchParams;
  const justSubscribed = sp.subscribed === "1";

  const sub = ctx.subscription;
  const active = sub?.status === "active";
  const stats = getProfileStats(ctx.user.id);
  const tools = getTools({ featuredOnly: true, type: "ai-tool" });
  const connections = getConnections(ctx.user.id);
  const professions = getProfessions();
  const memberSince = new Date(ctx.user.createdAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const initials = ctx.user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Identity header */}
      <header className="flex flex-wrap items-center gap-5 rounded-2xl border border-mist bg-sheet p-6">
        <span
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ultramarine text-xl font-bold text-white"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="display truncate text-2xl font-bold">{ctx.user.name}</h1>
          <p className="truncate text-sm text-ink-soft">{ctx.user.email}</p>
          <p className="mt-1 text-xs text-ink-soft">
            Member since {memberSince}
            {ctx.profile?.professionSlug && (
              <> · {professionNames.get(ctx.profile.professionSlug) ?? ctx.profile.professionSlug}</>
            )}
            {" · "}
            <span className="capitalize">{ctx.profile?.skillLevel ?? "beginner"}</span>
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            active ? "bg-moss/10 text-moss" : "bg-spark/10 text-spark"
          }`}
        >
          {active ? "Subscriber" : "Free plan"}
        </span>
      </header>

      {/* Section nav */}
      <nav className="flex flex-wrap gap-1.5 text-sm">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-mist bg-sheet px-3.5 py-1.5 font-medium text-ink-soft hover:border-cobalt/40 hover:text-ink"
          >
            {label}
          </a>
        ))}
      </nav>

      {justSubscribed && (
        <p className="rounded-xl border border-moss/30 bg-moss/10 px-4 py-3 text-sm font-medium text-moss">
          Subscription active — the whole library is now unlocked. Enjoy!
        </p>
      )}

      {/* Overview / stats */}
      <Card id="overview" title="Learning overview" subtitle="Your activity across the whole platform.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.lessonsCompleted} label="Lessons completed" />
          <Stat
            value={
              stats.minutesLearned >= 90
                ? `${Math.round(stats.minutesLearned / 60)}h`
                : `${stats.minutesLearned}m`
            }
            label="Time invested"
          />
          <Stat value={stats.streakDays} label="Day streak" />
          <Stat value={stats.bookmarks} label="Bookmarks" />
        </div>
        {stats.pathProgress.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {stats.pathProgress.map((p) => {
              const pct = Math.round((p.completed / p.total) * 100);
              return (
                <li key={p.slug}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link
                      href={`/app/paths/${p.slug}`}
                      className="min-w-0 truncate font-medium text-ink hover:text-ultramarine"
                    >
                      {p.title}
                    </Link>
                    <span className="shrink-0 font-mono text-xs text-ink-soft">
                      {p.completed}/{p.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist">
                    <div
                      className={`h-full rounded-full ${pct === 100 ? "bg-moss" : "bg-ultramarine"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-ink-soft">
            No lessons completed yet —{" "}
            <Link href="/app/paths" className="font-medium text-cobalt hover:underline">
              pick a learning path
            </Link>{" "}
            to get started.
          </p>
        )}
      </Card>

      {/* Editable details */}
      <Card id="details" title="Profile details" subtitle="How you appear on the platform and what we tailor for you.">
        <ProfileDetailsForm
          key={`${ctx.user.name}|${ctx.profile?.professionSlug ?? ""}|${ctx.profile?.skillLevel ?? ""}`}
          name={ctx.user.name}
          professionSlug={ctx.profile?.professionSlug ?? null}
          skillLevel={ctx.profile?.skillLevel ?? "beginner"}
          professions={professions}
        />
      </Card>

      {/* Subscription */}
      <Card id="subscription" title="Subscription">
        {active ? (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              <strong className="text-ink">SkillStack Monthly — €{sub?.priceEur ?? "5.99"}/month.</strong>{" "}
              Full access to every lesson, path and academy.
              {sub?.renewsAt && (
                <>
                  {" "}
                  Renews on{" "}
                  {new Date(sub.renewsAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  .
                </>
              )}
            </p>
            <form action={cancelSubscriptionAction} className="mt-4">
              <button className="rounded-lg border border-mist px-4 py-2 text-sm font-medium text-ink-soft hover:border-spark/40 hover:text-spark">
                Cancel subscription
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-soft">
              You&apos;re on the <strong className="text-ink">free plan</strong>: up to 10 lessons every
              day, resetting daily. Subscribe to read without limits.
            </p>
            <div className="mt-4 rounded-xl border border-ultramarine/20 bg-ultramarine/5 p-5">
              <p className="display text-2xl font-bold">
                €5.99<span className="text-sm font-medium text-ink-soft">/month</span>
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink">
                <li>✓ Every lesson, every academy, every profession path</li>
                <li>✓ Interactive coding courses with the built-in editor</li>
                <li>✓ Personalized learning paths and progress tracking</li>
                <li>✓ New and updated lessons as AI tools change</li>
                <li>✓ You practice in your own AI accounts — no hidden AI costs</li>
              </ul>
              <form action={subscribeAction} className="mt-4">
                <button className="w-full rounded-lg bg-ultramarine py-2.5 text-sm font-semibold text-white hover:bg-cobalt">
                  Subscribe — €5.99/month
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-ink-soft">
                Local build: checkout is simulated. Payments are wired to a provider at deployment.
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Connections */}
      <Card
        id="connections"
        title="AI accounts"
        subtitle="SkillStack teaches — your AI accounts do the work. You always practice in your own tools, on your own plan. We never resell AI access or share one account across learners."
      >
        <ConnectionsList tools={tools} connections={connections} />
        <p className="mt-4 rounded-xl border border-mist bg-paper p-4 text-xs leading-relaxed text-ink-soft">
          Connections use each provider&apos;s officially supported mechanism only. In this local build
          the connection state is simulated; production wiring follows each provider&apos;s current
          official third-party policy.
        </p>
      </Card>

      {/* Preferences */}
      <Card
        id="preferences"
        title="Learning preferences"
        subtitle="Set during onboarding — they shape your recommendations."
      >
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Goals</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {(ctx.profile?.goals ?? []).length ? (
                (ctx.profile?.goals ?? []).map((g) => (
                  <span key={g} className="rounded-full border border-mist bg-paper px-3 py-1">
                    {GOAL_LABELS.get(g) ?? skillNames.get(g) ?? g}
                  </span>
                ))
              ) : (
                <span className="text-ink-soft">Not set</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Tools you already use
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {(ctx.profile?.toolsUsed ?? []).length ? (
                (ctx.profile?.toolsUsed ?? []).map((t) => (
                  <span key={t} className="rounded-full border border-mist bg-paper px-3 py-1">
                    {toolMeta(t).name}
                  </span>
                ))
              ) : (
                <span className="text-ink-soft">Not set</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Tools you want to learn
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {(ctx.profile?.toolsToLearn ?? []).length ? (
                (ctx.profile?.toolsToLearn ?? []).map((t) => (
                  <span key={t} className="rounded-full border border-mist bg-paper px-3 py-1">
                    {toolMeta(t).name}
                  </span>
                ))
              ) : (
                <span className="text-ink-soft">Not set</span>
              )}
            </dd>
          </div>
        </dl>
        <Link
          href="/onboarding"
          className="mt-4 inline-block rounded-lg border border-mist px-4 py-2 text-sm font-medium text-ink hover:border-cobalt/40"
        >
          Redo onboarding
        </Link>
      </Card>

      {/* Security */}
      <Card id="security" title="Security">
        <PasswordForm />
        <div className="mt-6 border-t border-mist pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">Signed in as {ctx.user.email}</p>
            <form action={logoutAction}>
              <button className="rounded-lg border border-mist px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-spark/25 bg-spark/5 p-5">
          <h3 className="display text-sm font-semibold text-spark">Danger zone</h3>
          <div className="mt-3">
            <DeleteAccountForm email={ctx.user.email} />
          </div>
        </div>
      </Card>
    </div>
  );
}
