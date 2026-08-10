import Link from "next/link";
import type { Metadata } from "next";
import { getLessonCount } from "@/lib/queries/lessons";
import { getTools, getProfessions } from "@/lib/queries/taxonomy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing" };

const FAQ: [string, string][] = [
  [
    "Does the subscription include AI usage or tokens?",
    "No — and that's deliberate. You practice every lesson in your own AI accounts (Claude, ChatGPT, Gemini and so on), on your own plan. Most lessons work with the tools' free tiers. We sell education, not AI access.",
  ],
  [
    "Why text lessons instead of videos?",
    "AI tools change monthly. Text lessons are faster to read, searchable, copy-paste friendly and always up to date — we revise them the moment a tool changes, which is impossible with video.",
  ],
  [
    "Which AI tools are covered?",
    "Claude, Claude Code, ChatGPT, Codex, Gemini, Cursor, GitHub Copilot, Perplexity, NotebookLM, AI image tools, AI video tools, and automation/agents (including MCP). New tools are added as they matter.",
  ],
  [
    "I'm not technical. Is this for me?",
    "Yes. Most lessons are written for working professionals — real estate agents, accountants, lawyers, marketers, teachers and 20+ other professions. Coding academies exist for those who want them.",
  ],
  [
    "Can I cancel anytime?",
    "Yes, in one click from your account page. You keep access until the end of the paid period.",
  ],
  [
    "What do the free preview lessons include?",
    "The first lessons of every path are free with a plain account — no card required. Subscribe when you want the full library.",
  ],
];

export default function PricingPage() {
  const lessonCount = getLessonCount();
  const toolCount = getTools({ featuredOnly: true, type: "ai-tool" }).length;
  const technologyCount = getTools({ featuredOnly: true, type: "technology" }).length;
  const professionCount = getProfessions().length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="display text-center text-4xl font-bold">Simple pricing. Serious library.</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
        One subscription, everything included. No tiers, no per-course fees, no AI usage bills
        hiding behind the price.
      </p>

      <div className="mx-auto mt-12 max-w-md rounded-2xl border-2 border-ultramarine bg-sheet p-8 shadow-[0_24px_60px_-30px_rgba(43,58,143,0.4)]">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ultramarine">
          SkillStack Monthly
        </p>
        <p className="display mt-3 text-5xl font-bold">
          €5.99<span className="text-base font-medium text-ink-soft">/month</span>
        </p>
        <ul className="mt-6 space-y-2.5 text-sm">
          <li>✓ All {lessonCount}+ lessons — growing toward thousands</li>
          <li>✓ {toolCount} AI tool academies, incl. the 3-course Claude track</li>
          <li>
            ✓ {technologyCount} interactive coding {technologyCount === 1 ? "technology" : "technologies"} with
            a built-in editor, starting with HTML
          </li>
          <li>✓ {professionCount} profession paths</li>
          <li>✓ Personalized learning path from your onboarding</li>
          <li>✓ Knowledge checks in every lesson + smart prompt personalization</li>
          <li>✓ Full-text search, filters, bookmarks and progress</li>
          <li>✓ Lessons revised as AI tools change</li>
        </ul>
        <Link
          href="/signup"
          className="mt-8 block rounded-lg bg-ultramarine py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-cobalt"
        >
          Start learning
        </Link>
        <p className="mt-3 text-center text-xs text-ink-soft">
          Free preview lessons with any account. Cancel anytime.
        </p>
      </div>

      <section className="mt-20">
        <h2 className="display text-2xl font-bold">Questions, answered</h2>
        <dl className="mt-6 divide-y divide-mist">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="display font-semibold">{q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
