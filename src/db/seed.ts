/**
 * Seeds the database from /content: taxonomy.json, lessons/*.json, paths/*.json.
 * Validates every lesson against the taxonomy and reports problems per file.
 * Run: npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import { db, sqlite } from "./index";
import { lessonTools, lessonProfessions, lessonSkills, paths, pathLessons } from "./schema";

const CONTENT = path.join(process.cwd(), "content");
const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

type CodingJson = {
  intro: string;
  sections: { heading: string; body: string; code?: string }[];
  starterCode: string;
  solutionCode: string;
  tasks: {
    id: string; instruction: string; hint: string; errorMessage: string;
    check: { type: string; selector?: string; attr?: string; value?: string; pattern?: string; min?: number };
  }[];
};

type LessonJson = {
  slug: string; title: string; summary: string; difficulty: string; minutes?: number;
  isFree?: boolean; goal: string; whyItMatters: string; beforeYouStart?: string;
  steps: string[]; prompt: string; promptLabel?: string; explanation: string;
  example: string; exercise: string; expectedResult: string; commonMistakes: string[];
  proTip?: string; tools: string[]; professions?: string[]; skills: string[];
  kind?: string; coding?: CodingJson;
};

type PathJson = {
  slug: string; title: string; tagline: string; description: string; kind: string;
  level?: string; toolSlug?: string; professionSlug?: string; sortOrder?: number;
  nextPath?: string; // course chaining: recommended follow-up path
  lessons: string[];
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
}

function validateLesson(l: LessonJson, toolSet: Set<string>, profSet: Set<string>, skillSet: Set<string>): string[] {
  const errors: string[] = [];
  const req: (keyof LessonJson)[] = ["slug", "title", "summary", "goal", "whyItMatters", "prompt", "explanation", "example", "exercise", "expectedResult"];
  for (const k of req) if (!l[k] || typeof l[k] !== "string") errors.push(`missing field: ${k}`);
  if (!DIFFICULTIES.has(l.difficulty)) errors.push(`bad difficulty: ${l.difficulty}`);
  if (!Array.isArray(l.steps) || l.steps.length < 2) errors.push("steps must have >= 2 entries");
  if (!Array.isArray(l.commonMistakes) || l.commonMistakes.length < 1) errors.push("commonMistakes required");
  if (!Array.isArray(l.tools) || l.tools.length < 1) errors.push("at least one tool tag required");
  if (!Array.isArray(l.skills) || l.skills.length < 1) errors.push("at least one skill tag required");
  for (const t of l.tools ?? []) if (!toolSet.has(t)) errors.push(`unknown tool: ${t}`);
  for (const p of l.professions ?? []) if (!profSet.has(p)) errors.push(`unknown profession: ${p}`);
  for (const s of l.skills ?? []) if (!skillSet.has(s)) errors.push(`unknown skill: ${s}`);
  if (l.kind && l.kind !== "text" && l.kind !== "coding") errors.push(`bad kind: ${l.kind}`);
  if (l.kind === "coding") {
    const c = l.coding;
    if (!c) errors.push("coding lessons require a coding payload");
    else {
      if (!c.intro || typeof c.intro !== "string") errors.push("coding.intro required");
      if (!Array.isArray(c.sections) || c.sections.length < 2) errors.push("coding.sections must have >= 2 entries");
      for (const s of c.sections ?? []) if (!s.heading || !s.body) errors.push("coding.sections entries need heading + body");
      if (typeof c.starterCode !== "string") errors.push("coding.starterCode required");
      if (!c.solutionCode || typeof c.solutionCode !== "string") errors.push("coding.solutionCode required");
      if (!Array.isArray(c.tasks) || c.tasks.length < 1) errors.push("coding.tasks must have >= 1 entry");
      const CHECKS = new Set(["doctype", "selector", "selectorCount", "attr", "text", "source"]);
      const taskIds = new Set<string>();
      for (const t of c.tasks ?? []) {
        if (!t.id || !t.instruction || !t.hint || !t.errorMessage) errors.push(`coding task missing id/instruction/hint/errorMessage`);
        if (t.id && taskIds.has(t.id)) errors.push(`duplicate coding task id: ${t.id}`);
        if (t.id) taskIds.add(t.id);
        if (!t.check || !CHECKS.has(t.check.type)) errors.push(`coding task ${t.id ?? "?"}: bad check type`);
        else {
          const ck = t.check;
          if (["selector", "selectorCount", "attr", "text"].includes(ck.type) && !ck.selector) errors.push(`coding task ${t.id}: check needs selector`);
          if (ck.type === "selectorCount" && typeof ck.min !== "number") errors.push(`coding task ${t.id}: selectorCount needs min`);
          if (ck.type === "attr" && !ck.attr) errors.push(`coding task ${t.id}: attr check needs attr`);
          if ((ck.type === "text" || ck.type === "source") && !ck.pattern) errors.push(`coding task ${t.id}: check needs pattern`);
          if (ck.pattern) {
            try { new RegExp(ck.pattern, "i"); } catch { errors.push(`coding task ${t.id}: invalid regex pattern`); }
          }
        }
      }
    }
  }
  return errors;
}

function seed() {
  const now = new Date().toISOString();
  const taxonomy = readJson<{
    tools: {
      slug: string; name: string; tagline: string; description: string; category: string;
      type?: string; color?: string; connectMode?: string; launchUrl?: string; docsUrl?: string;
      featured?: boolean; sortOrder?: number;
    }[];
    professions: { slug: string; name: string; tagline: string; description?: string; sortOrder?: number }[];
    skills: { slug: string; name: string; description?: string }[];
  }>(path.join(CONTENT, "taxonomy.json"));

  // Idempotent seed that PRESERVES user data: lessons are upserted (never wholesale-deleted,
  // so progress/bookmarks survive reseeds); tag junctions and paths carry no user data and are
  // rebuilt; taxonomy rows are upserted. Lessons removed from content are deleted at the end.
  sqlite.exec(
    "DELETE FROM path_lessons; DELETE FROM paths; DELETE FROM lesson_tools; DELETE FROM lesson_professions; DELETE FROM lesson_skills;"
  );

  const upsert = (table: string, row: Record<string, unknown>) => {
    const cols = Object.keys(row);
    const conflictSets = cols.filter((c) => c !== "slug").map((c) => `${c}=excluded.${c}`).join(", ");
    sqlite
      .prepare(
        `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})
         ON CONFLICT(slug) DO UPDATE SET ${conflictSets}`
      )
      .run(...cols.map((c) => row[c]));
  };

  for (const t of taxonomy.tools)
    upsert("tools", {
      slug: t.slug, name: t.name, tagline: t.tagline, description: t.description,
      type: t.type ?? "ai-tool",
      category: t.category, color: t.color ?? "#6366f1", connect_mode: t.connectMode ?? "external-launch",
      launch_url: t.launchUrl ?? null, docs_url: t.docsUrl ?? null,
      featured: t.featured === false ? 0 : 1, sort_order: t.sortOrder ?? 0,
    });
  for (const p of taxonomy.professions)
    upsert("professions", {
      slug: p.slug, name: p.name, tagline: p.tagline,
      description: p.description ?? p.tagline, sort_order: p.sortOrder ?? 0,
    });
  for (const s of taxonomy.skills)
    upsert("skills", { slug: s.slug, name: s.name, description: s.description ?? "" });

  const toolSet = new Set(taxonomy.tools.map((t) => t.slug));
  const profSet = new Set(taxonomy.professions.map((p) => p.slug));
  const skillSet = new Set(taxonomy.skills.map((s) => s.slug));

  // Lessons
  let ok = 0, failed = 0;
  const seen = new Set<string>();
  for (const file of listJsonFiles(path.join(CONTENT, "lessons"))) {
    let data: { lessons: LessonJson[] };
    try {
      data = readJson(file);
    } catch (e) {
      console.error(`✗ ${path.basename(file)}: invalid JSON — ${(e as Error).message}`);
      failed++;
      continue;
    }
    for (const l of data.lessons ?? []) {
      const errors = validateLesson(l, toolSet, profSet, skillSet);
      if (seen.has(l.slug)) errors.push(`duplicate slug: ${l.slug}`);
      if (errors.length) {
        console.error(`✗ ${path.basename(file)} [${l.slug ?? "?"}]: ${errors.join("; ")}`);
        failed++;
        continue;
      }
      seen.add(l.slug);
      upsert("lessons", {
        slug: l.slug, title: l.title, summary: l.summary, difficulty: l.difficulty,
        minutes: l.minutes ?? 8, is_free: l.isFree ? 1 : 0, goal: l.goal,
        why_it_matters: l.whyItMatters, before_you_start: l.beforeYouStart ?? null,
        steps: JSON.stringify(l.steps), prompt: l.prompt,
        prompt_label: l.promptLabel ?? "Copyable prompt",
        explanation: l.explanation, example: l.example, exercise: l.exercise,
        expected_result: l.expectedResult, common_mistakes: JSON.stringify(l.commonMistakes),
        pro_tip: l.proTip ?? null, quiz: null, enrichment: null,
        kind: l.kind ?? "text", coding: l.coding ? JSON.stringify(l.coding) : null,
        revision_status: "current", updated_at: now,
      });
      for (const t of [...new Set(l.tools)]) db.insert(lessonTools).values({ lessonSlug: l.slug, toolSlug: t }).run();
      for (const p of [...new Set(l.professions ?? [])]) db.insert(lessonProfessions).values({ lessonSlug: l.slug, professionSlug: p }).run();
      for (const s of [...new Set(l.skills)]) db.insert(lessonSkills).values({ lessonSlug: l.slug, skillSlug: s }).run();
      ok++;
    }
  }

  // Paths
  let pathsOk = 0;
  for (const file of listJsonFiles(path.join(CONTENT, "paths"))) {
    let data: { paths: PathJson[] };
    try {
      data = readJson(file);
    } catch (e) {
      console.error(`✗ ${path.basename(file)}: invalid JSON — ${(e as Error).message}`);
      continue;
    }
    for (const p of data.paths ?? []) {
      const known = p.lessons.filter((slug) => seen.has(slug));
      const missing = p.lessons.filter((slug) => !seen.has(slug));
      if (missing.length) console.warn(`⚠ path ${p.slug}: skipping missing lessons: ${missing.join(", ")}`);
      if (!known.length) {
        console.error(`✗ path ${p.slug}: no valid lessons, skipped`);
        continue;
      }
      db.insert(paths).values({
        slug: p.slug, title: p.title, tagline: p.tagline, description: p.description,
        kind: p.kind, level: p.level ?? "mixed", toolSlug: p.toolSlug ?? null,
        professionSlug: p.professionSlug ?? null, sortOrder: p.sortOrder ?? 0,
        nextPathSlug: p.nextPath ?? null,
      }).run();
      known.forEach((slug, i) =>
        db.insert(pathLessons).values({ pathSlug: p.slug, lessonSlug: slug, position: i + 1 }).run()
      );
      pathsOk++;
    }
  }

  // Validate course chains now that every path row exists; clear dangling links.
  const chainRows = sqlite
    .prepare("SELECT slug, next_path_slug FROM paths WHERE next_path_slug IS NOT NULL")
    .all() as { slug: string; next_path_slug: string }[];
  for (const row of chainRows) {
    const exists = sqlite.prepare("SELECT 1 FROM paths WHERE slug = ?").get(row.next_path_slug);
    if (!exists) {
      console.warn(`⚠ path ${row.slug}: nextPath "${row.next_path_slug}" does not exist — cleared`);
      sqlite.prepare("UPDATE paths SET next_path_slug = NULL WHERE slug = ?").run(row.slug);
    }
  }

  // Remove lessons that no longer exist in content (cascades their progress/bookmarks only).
  const dbSlugs = (sqlite.prepare("SELECT slug FROM lessons").all() as { slug: string }[]).map((r) => r.slug);
  const removed = dbSlugs.filter((s) => !seen.has(s));
  if (removed.length) {
    const del = sqlite.prepare("DELETE FROM lessons WHERE slug = ?");
    for (const s of removed) del.run(s);
    console.warn(`⚠ removed ${removed.length} lessons no longer in content: ${removed.join(", ")}`);
  }

  // Quizzes: content/quizzes/*.json → { "quizzes": { "<lesson-slug>": [ {q, options, answer, why} ] } }
  let quizOk = 0, quizBad = 0;
  const updateQuiz = sqlite.prepare("UPDATE lessons SET quiz = ? WHERE slug = ?");
  for (const file of listJsonFiles(path.join(CONTENT, "quizzes"))) {
    let data: { quizzes: Record<string, { q: string; options: string[]; answer: number; why: string }[]> };
    try {
      data = readJson(file);
    } catch (e) {
      console.error(`✗ ${path.basename(file)}: invalid JSON — ${(e as Error).message}`);
      continue;
    }
    for (const [slug, questions] of Object.entries(data.quizzes ?? {})) {
      const errors: string[] = [];
      if (!seen.has(slug)) errors.push("unknown lesson slug");
      if (!Array.isArray(questions) || questions.length < 1) errors.push("no questions");
      for (const question of questions ?? []) {
        if (!question.q || !Array.isArray(question.options) || question.options.length < 2)
          errors.push("bad question shape");
        else if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length)
          errors.push("answer index out of range");
        if (!question.why) errors.push("missing why");
      }
      if (errors.length) {
        console.error(`✗ quiz ${path.basename(file)} [${slug}]: ${[...new Set(errors)].join("; ")}`);
        quizBad++;
        continue;
      }
      updateQuiz.run(JSON.stringify(questions), slug);
      quizOk++;
    }
  }

  // Enrichment: content/enrichment/*.json →
  // { "enrichment": { "<lesson-slug>": { placeholders, variations, followUps, walkthrough } } }
  let enrichOk = 0, enrichBad = 0;
  const updateEnrichment = sqlite.prepare("UPDATE lessons SET enrichment = ? WHERE slug = ?");
  const getPrompt = sqlite.prepare("SELECT prompt FROM lessons WHERE slug = ?");
  type EnrichmentJson = {
    placeholders?: { name: string; what: string; examples: string[] }[];
    variations?: { label: string; whenToUse: string; prompt: string }[];
    followUps?: { label: string; prompt: string }[];
    walkthrough?: string;
  };
  for (const file of listJsonFiles(path.join(CONTENT, "enrichment"))) {
    let data: { enrichment: Record<string, EnrichmentJson> };
    try {
      data = readJson(file);
    } catch (e) {
      console.error(`✗ ${path.basename(file)}: invalid JSON — ${(e as Error).message}`);
      continue;
    }
    for (const [slug, enr] of Object.entries(data.enrichment ?? {})) {
      const errors: string[] = [];
      if (!seen.has(slug)) errors.push("unknown lesson slug");
      const promptText = (getPrompt.get(slug) as { prompt: string } | undefined)?.prompt ?? "";
      for (const ph of enr.placeholders ?? []) {
        if (!ph.name || !ph.what || !Array.isArray(ph.examples) || ph.examples.length < 1)
          errors.push(`placeholder ${ph.name ?? "?"}: missing what/examples`);
        else if (!promptText.includes(`[${ph.name}]`))
          errors.push(`placeholder [${ph.name}] not found in prompt`);
      }
      for (const v of enr.variations ?? [])
        if (!v.label || !v.whenToUse || !v.prompt) errors.push("variation missing label/whenToUse/prompt");
      for (const f of enr.followUps ?? [])
        if (!f.label || !f.prompt) errors.push("followUp missing label/prompt");
      if (enr.walkthrough !== undefined && enr.walkthrough.length < 100)
        errors.push("walkthrough too short");
      if (
        !enr.walkthrough &&
        !(enr.variations?.length) &&
        !(enr.followUps?.length) &&
        !(enr.placeholders?.length)
      )
        errors.push("empty enrichment");
      if (errors.length) {
        console.error(`✗ enrichment ${path.basename(file)} [${slug}]: ${[...new Set(errors)].join("; ")}`);
        enrichBad++;
        continue;
      }
      updateEnrichment.run(JSON.stringify(enr), slug);
      enrichOk++;
    }
  }

  // Path outcomes: content/path-outcomes.json → { "<path-slug>": ["outcome", ...] }
  let outcomesOk = 0;
  const outcomesFile = path.join(CONTENT, "path-outcomes.json");
  if (fs.existsSync(outcomesFile)) {
    try {
      const data = readJson<Record<string, string[]>>(outcomesFile);
      const updateOutcomes = sqlite.prepare("UPDATE paths SET outcomes = ? WHERE slug = ?");
      const pathSlugs = new Set(
        (sqlite.prepare("SELECT slug FROM paths").all() as { slug: string }[]).map((r) => r.slug)
      );
      for (const [slug, outcomes] of Object.entries(data)) {
        if (!pathSlugs.has(slug)) {
          console.error(`✗ outcomes: unknown path ${slug}`);
          continue;
        }
        if (!Array.isArray(outcomes) || outcomes.length < 2) continue;
        updateOutcomes.run(JSON.stringify(outcomes), slug);
        outcomesOk++;
      }
    } catch (e) {
      console.error(`✗ path-outcomes.json: ${(e as Error).message}`);
    }
  }

  // Full-text search index
  sqlite.exec(`
    DROP TABLE IF EXISTS lessons_fts;
    CREATE VIRTUAL TABLE lessons_fts USING fts5(slug UNINDEXED, title, summary, goal, prompt, tags);
  `);
  const insertFts = sqlite.prepare("INSERT INTO lessons_fts (slug, title, summary, goal, prompt, tags) VALUES (?, ?, ?, ?, ?, ?)");
  const allLessons = sqlite.prepare(`
    SELECT l.slug, l.title, l.summary, l.goal, l.prompt,
      (SELECT group_concat(tool_slug, ' ') FROM lesson_tools WHERE lesson_slug = l.slug) ||
      ' ' || COALESCE((SELECT group_concat(profession_slug, ' ') FROM lesson_professions WHERE lesson_slug = l.slug), '') ||
      ' ' || COALESCE((SELECT group_concat(skill_slug, ' ') FROM lesson_skills WHERE lesson_slug = l.slug), '') AS tags
    FROM lessons l
  `).all() as { slug: string; title: string; summary: string; goal: string; prompt: string; tags: string }[];
  for (const l of allLessons) insertFts.run(l.slug, l.title, l.summary, l.goal, l.prompt, l.tags);

  console.log(`\nSeed complete: ${ok} lessons (${failed} rejected), ${pathsOk} paths, ${quizOk} quizzes (${quizBad} rejected), ${enrichOk} enrichments (${enrichBad} rejected), ${outcomesOk} path outcome sets, ${taxonomy.tools.length} tools, ${taxonomy.professions.length} professions, ${taxonomy.skills.length} skills.`);
  if (failed > 0) process.exitCode = 1;
}

seed();
