# SkillStack — AI Skills Learning Platform

A subscription-based, **text-only** learning platform that teaches professionals how to use every
major AI tool — Claude, Claude Code, ChatGPT, Codex, Gemini, Cursor, GitHub Copilot, Perplexity,
NotebookLM, AI image/video tools and automation/agents — organized by **tool × profession × skill ×
difficulty**, at **€5.99/month**.

Built per `AI_Skills_Learning_Platform_Master_Brief.pdf`. Learners always practice in **their own
AI accounts** (bring-your-own-account) — the platform never resells AI access.

## Quick start (localhost)

```bash
npm install
npm run db:setup     # creates data/skillstack.db, seeds 322 lessons / 42 paths
npm run dev          # → http://localhost:3000
```

Then: create an account at `/signup` → onboarding builds your personalized paths → read lessons,
copy prompts, mark complete. The subscribe button on `/app/account` is a **local mock checkout**
(flips the subscription flag) — swap in a real payment provider at deployment.

Full catalog listing: see [`CURRICULUM.md`](./CURRICULUM.md) (generated — regenerate with
`npx tsx scripts/export-curriculum.ts`).

## What's inside

| Area | Route(s) |
|---|---|
| Marketing site | `/` (landing), `/pricing`, `/tools`, `/tools/[slug]`, `/professions`, `/professions/[slug]`, `/courses` (Claude track) |
| Auth | `/signup`, `/login` (scrypt + httpOnly session cookie) |
| Onboarding | `/onboarding` (profession, tools, level, goals → personalization) |
| App | `/app` (discovery), `/app/library` (FTS search + filters), `/app/paths`, `/app/paths/[slug]`, `/app/lessons/[slug]`, `/app/my`, `/app/accounts` (provider connections), `/app/account` (subscription) |

Content: 3 Claude courses (Beginner / Intermediate / Advanced), 11 tool academies, 28 profession
paths — 322 lessons, each with the brief's 11-section structure (goal, why it matters, steps,
copyable prompt, explanation, example, exercise, expected result, common mistakes, pro tip,
completion → next lesson) **plus a 3-question knowledge check** (auto-graded, with explanations).

Learning features: **smart prompt fill-in** (lesson prompts detect `[PLACEHOLDERS]` and offer a
personalize-before-copy form with beginner guidance and clickable real examples per field),
**prompt variations** (2-3 alternative prompts per lesson with when-to-use), **ready follow-up
prompts** ("Improve the first answer"), **full beginner-proof walkthroughs**, **course outcomes**
("After this course you can…") on every path, and an SEO layer (public lesson teaser pages at
`/lessons/[slug]`, `sitemap.xml`, `robots.txt`, per-page metadata). Quiz content lives in
`content/quizzes/*.json`; enrichment in `content/enrichment/*.json` (spec:
`content/ENRICHMENT-SPEC.md`); outcomes in `content/path-outcomes.json` — all validated at seed
time.

## Architecture

```
content/                 ← the editorial layer (source of truth for lessons)
  taxonomy.json          ← tools, professions, skills
  lessons/*.json         ← lessons per area (validated on seed)
  paths/*.json           ← ordered learning paths
  AUTHORING.md           ← the lesson format spec (give this to any author/agent)
src/db/
  schema.ts              ← Drizzle schema (SQLite dialect — D1-compatible)
  index.ts               ← better-sqlite3 client singleton
  seed.ts                ← validating seed + FTS5 index build
src/lib/
  auth/                  ← password.ts, session.ts, actions.ts
  queries/               ← taxonomy / lessons / paths / search / user (small modules)
  actions/learning.ts    ← complete, bookmark, onboarding, subscribe, connections
src/components/          ← small reusable UI pieces (cards, badges, prompt block…)
src/app/                 ← (marketing) / (auth) / app / onboarding route groups
research/                ← deep research crawl notes (claude.md, tools.md) used to author content
```

Design decisions for maintainability:

- **Content is data, not code.** Lessons live in JSON; the seed script validates every lesson
  against the taxonomy and rejects bad entries with a per-file report. Adding 100 lessons = adding
  JSON files + `npm run db:seed`.
- **Small modules.** Queries, actions, auth and components are split into focused files; no file
  carries more than one concern.
- **Provider-agnostic.** Tools are DB records with a `connectMode` (`own-allowance` /
  `external-launch` / `unavailable`). Adding a new AI tool = one taxonomy entry + lessons; no
  schema or UI changes.
- **BYO-account by design.** Lesson actions are copy-prompt / open-provider / mark-complete. The
  "connect account" flow is a stub that only enables where a provider officially supports it
  (e.g. Anthropic's Agent-SDK-with-your-plan policy).

## Deployment plan (Vercel + Cloudflare)

Per the brief: app hosting on **Vercel**, remaining infrastructure on **Cloudflare**. The code was
built to make that migration mechanical:

1. **Database → Cloudflare D1.** The schema uses Drizzle's SQLite dialect, which is what D1 speaks.
   Migration = `drizzle-kit generate` → `wrangler d1 migrations apply`, then swap
   `drizzle-orm/better-sqlite3` for `drizzle-orm/d1` in `src/db/index.ts` (one file). The seed
   script's SQL is D1-compatible; FTS5 is supported on D1.
2. **Search.** `lessons_fts` (FTS5) works on D1 as-is; if the catalog grows very large, move to
   Cloudflare Workers AI / Vectorize semantic search behind the same `searchLessons()` interface
   (`src/lib/queries/search.ts` is the only file to touch).
3. **Sessions.** Cookie-token sessions live in the `sessions` table — portable as-is; optionally
   move to Cloudflare KV for latency.
4. **Assets / CDN / DNS / WAF** → Cloudflare in front of Vercel per the brief.
5. **Payments.** `subscribeAction()` in `src/lib/actions/learning.ts` is the single integration
   point — replace the mock with Stripe (or other) checkout + webhook that updates the
   `subscriptions` row.
6. **Env.** `DATABASE_PATH` env var already parameterizes the DB location.

## Content maintenance

AI products change monthly — the content system assumes it:

- Every lesson has `revisionStatus` + `updatedAt` and tool tags, so when a provider changes a
  feature you can find every affected lesson (`lesson_tools`) and revise the JSON.
- `research/claude.md` and `research/tools.md` hold the August 2026 research crawl the catalog was
  written from — refresh these when re-verifying content.
- `content/AUTHORING.md` is the complete spec for writing new lessons (humans or AI agents).

## Testing

- `npx tsc --noEmit` — types are clean.
- `npm run build` — production build passes.
- End-to-end (Playwright, 22 checks): signup → onboarding → personalized dashboard → free lesson →
  complete → bookmark → paywall → subscribe → unlock → search → filters → my-learning → provider
  connect → marketing pages → logout/login.
