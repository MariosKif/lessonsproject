import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// ---------- Taxonomy ----------

// The tools table holds every teachable topic. `type` discriminates the two families:
// "ai-tool" = an external AI product (Claude, ChatGPT…) with accounts/connections;
// "technology" = a subject taught with the built-in editor (HTML, later CSS/JS…).
export const tools = sqliteTable("tools", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("ai-tool"), // ai-tool | technology
  category: text("category").notNull(), // assistant | coding | research | image | video | automation | web-fundamentals
  color: text("color").notNull().default("#6366f1"),
  connectMode: text("connect_mode").notNull().default("external-launch"), // own-allowance | external-launch | unavailable
  launchUrl: text("launch_url"),
  docsUrl: text("docs_url"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const professions = sqliteTable("professions", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = sqliteTable("skills", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});

// ---------- Lessons ----------

export const lessons = sqliteTable("lessons", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  difficulty: text("difficulty").notNull(), // beginner | intermediate | advanced
  minutes: integer("minutes").notNull().default(8),
  isFree: integer("is_free", { mode: "boolean" }).notNull().default(false),
  goal: text("goal").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  beforeYouStart: text("before_you_start"),
  steps: text("steps", { mode: "json" }).$type<string[]>().notNull(),
  prompt: text("prompt").notNull(),
  promptLabel: text("prompt_label").notNull().default("Copyable prompt"),
  explanation: text("explanation").notNull(),
  example: text("example").notNull(),
  exercise: text("exercise").notNull(),
  expectedResult: text("expected_result").notNull(),
  commonMistakes: text("common_mistakes", { mode: "json" }).$type<string[]>().notNull(),
  proTip: text("pro_tip"),
  quiz: text("quiz", { mode: "json" }).$type<QuizQuestion[]>(),
  enrichment: text("enrichment", { mode: "json" }).$type<Enrichment>(),
  kind: text("kind").notNull().default("text"), // text | coding
  coding: text("coding", { mode: "json" }).$type<CodingData>(),
  revisionStatus: text("revision_status").notNull().default("current"),
  updatedAt: text("updated_at").notNull(),
});

export type CodingTheorySection = {
  heading: string;
  body: string; // plain text, \n\n paragraphs
  code?: string; // illustrative HTML snippet shown highlighted
};

export type CodingCheck =
  | { type: "doctype" }
  | { type: "selector"; selector: string }
  | { type: "selectorCount"; selector: string; min: number }
  | { type: "attr"; selector: string; attr: string; value?: string; pattern?: string }
  | { type: "text"; selector: string; pattern: string }
  | { type: "source"; pattern: string };

export type CodingTask = {
  id: string;
  instruction: string; // what the learner must do in the editor
  hint: string;
  errorMessage: string; // shown in the feedback console while failing
  check: CodingCheck;
};

export type CodingData = {
  intro: string; // 1-2 sentence framing for the practice pane
  sections: CodingTheorySection[]; // the full analytical theory (left column)
  starterCode: string; // initial editor contents
  solutionCode: string; // reference solution (revealable)
  tasks: CodingTask[];
};

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options
  why: string; // shown after checking
};

export type PlaceholderGuide = {
  name: string; // matches a [PLACEHOLDER] in the prompt, without brackets
  what: string; // plain-language explanation for a total beginner
  examples: string[]; // 2-3 complete, realistic example values (clickable fills)
};

export type PromptVariation = {
  label: string;
  whenToUse: string;
  prompt: string;
};

export type FollowUp = {
  label: string;
  prompt: string; // ready to paste after the first AI response
};

export type Enrichment = {
  placeholders?: PlaceholderGuide[];
  variations?: PromptVariation[];
  followUps?: FollowUp[];
  walkthrough?: string; // fully worked, beginner-proof example run
};

export const lessonTools = sqliteTable(
  "lesson_tools",
  {
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    toolSlug: text("tool_slug").notNull().references(() => tools.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.lessonSlug, t.toolSlug] })]
);

export const lessonProfessions = sqliteTable(
  "lesson_professions",
  {
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    professionSlug: text("profession_slug").notNull().references(() => professions.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.lessonSlug, t.professionSlug] })]
);

export const lessonSkills = sqliteTable(
  "lesson_skills",
  {
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    skillSlug: text("skill_slug").notNull().references(() => skills.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.lessonSlug, t.skillSlug] })]
);

// ---------- Learning paths ----------

export const paths = sqliteTable("paths", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  kind: text("kind").notNull(), // tool-course | profession | skill
  level: text("level"), // beginner | intermediate | advanced | mixed
  outcomes: text("outcomes", { mode: "json" }).$type<string[]>(),
  toolSlug: text("tool_slug").references(() => tools.slug),
  professionSlug: text("profession_slug").references(() => professions.slug),
  sortOrder: integer("sort_order").notNull().default(0),
  // Course chaining: the path to recommend when this one is finished
  // (e.g. html-foundations → html-intermediate). Plain text, validated in seed.
  nextPathSlug: text("next_path_slug"),
});

export const pathLessons = sqliteTable(
  "path_lessons",
  {
    pathSlug: text("path_slug").notNull().references(() => paths.slug, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pathSlug, t.lessonSlug] })]
);

// ---------- Users ----------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the token
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(), // unix seconds
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  professionSlug: text("profession_slug"),
  skillLevel: text("skill_level").notNull().default("beginner"),
  goals: text("goals", { mode: "json" }).$type<string[]>().notNull().default([]),
  toolsUsed: text("tools_used", { mode: "json" }).$type<string[]>().notNull().default([]),
  toolsToLearn: text("tools_to_learn", { mode: "json" }).$type<string[]>().notNull().default([]),
  onboarded: integer("onboarded", { mode: "boolean" }).notNull().default(false),
});

export const subscriptions = sqliteTable("subscriptions", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("none"), // none | active | canceled
  plan: text("plan").notNull().default("monthly"),
  priceEur: text("price_eur").notNull().default("5.99"),
  startedAt: text("started_at"),
  renewsAt: text("renews_at"),
});

// ---------- Activity ----------

export const progress = sqliteTable(
  "progress",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    completedAt: text("completed_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })]
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })]
);

export const recentlyViewed = sqliteTable(
  "recently_viewed",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull().references(() => lessons.slug, { onDelete: "cascade" }),
    viewedAt: text("viewed_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })]
);

export const providerConnections = sqliteTable(
  "provider_connections",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    toolSlug: text("tool_slug").notNull().references(() => tools.slug, { onDelete: "cascade" }),
    status: text("status").notNull().default("disconnected"), // connected | disconnected
    connectedAt: text("connected_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.toolSlug] })]
);
