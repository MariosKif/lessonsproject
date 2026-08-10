# Lesson Authoring Specification

> **Interactive coding lessons** (`kind: "coding"`, e.g. the HTML track): all standard fields below
> still apply, plus a `coding` payload — `{ intro, sections[{heading, body, code?}], starterCode,
> solutionCode, tasks[{id, instruction, hint, errorMessage, check}] }`. Valid `check.type` values:
> `doctype`, `selector`, `selectorCount` (+`min`), `attr` (+`attr`, optional `value`/`pattern`),
> `text` (+`pattern`), `source` (+`pattern`). Checks run client-side against the learner's editor
> code via DOMParser (no JS execution). Coding lessons render as a two-column workbench (theory
> left; editor + live preview + feedback console right) and skip the prompt/enrichment sections.
> Enrichment sidecars are NOT required for coding lessons; quizzes still are.

> Companion specs: `ENRICHMENT-SPEC.md` (placeholder guides, prompt variations, follow-ups,
> walkthroughs — required for every lesson, stored in `content/enrichment/`), quizzes in
> `content/quizzes/` (3 scenario questions per lesson), outcomes in `content/path-outcomes.json`.

Every lesson is a JSON object inside a file at `content/lessons/<area>.json`:

```json
{ "lessons": [ { ...lesson }, ... ] }
```

Learning paths live in `content/paths/<area>.json`:

```json
{ "paths": [ { "slug": "...", "title": "...", "tagline": "...", "description": "...",
  "kind": "tool-course | profession | skill", "level": "beginner|intermediate|advanced|mixed",
  "toolSlug": "claude", "professionSlug": null, "sortOrder": 1,
  "lessons": ["lesson-slug-1", "lesson-slug-2"] } ] }
```

## Lesson JSON fields (all required unless noted)

| Field | Type | Rule |
|---|---|---|
| slug | string | kebab-case, globally unique, prefixed by area (e.g. `claude-b1-first-conversation`) |
| title | string | Outcome-oriented: "Turn a product brief into 20 ad angles with Claude" — never "Introduction to X" alone |
| summary | string | 1-2 sentences, plain language, what the learner will be able to do |
| difficulty | string | `beginner` \| `intermediate` \| `advanced` |
| minutes | number | realistic reading+practice time, 5-15 |
| isFree | boolean | `true` only for the first 2 lessons of each path (free preview) |
| goal | string | ONE sentence: what the learner accomplishes |
| whyItMatters | string | 2-4 sentences of practical professional context |
| beforeYouStart | string (optional) | prerequisites/accounts/files, only when genuinely needed |
| steps | string[] | 4-9 concise ordered workflow steps. Each step one clear action, may be 1-3 sentences |
| prompt | string | Ready-to-copy prompt/command/instruction. Use `[PASTE NOTES]`-style placeholders. Multi-line allowed with \n |
| promptLabel | string (optional) | e.g. "Copyable prompt", "Copyable instruction", "Command" |
| explanation | string | 3-6 sentences: WHY the prompt/workflow works, what the important parts do |
| example | string | Concrete example input and the expected type of output (can be multi-paragraph with \n\n) |
| exercise | string | Small "Try it" task the learner performs in their OWN AI account |
| expectedResult | string | 1-3 sentences describing what success looks like |
| commonMistakes | string[] | 2-4 typical failure modes, each 1-2 sentences |
| proTip | string (optional) | one advanced improvement |
| tools | string[] | tool slugs this lesson applies to (at least 1) |
| professions | string[] (optional) | profession slugs where this lesson belongs in that path |
| skills | string[] | skill slugs (at least 1) |

## Valid taxonomy slugs

Tools: `claude`, `claude-code`, `chatgpt`, `codex`, `gemini`, `cursor`, `github-copilot`, `perplexity`, `notebooklm`, `ai-image`, `ai-video`, `automation-agents`

Professions: `real-estate-agent`, `accountant`, `lawyer`, `software-developer`, `marketer`, `sales-professional`, `recruiter-hr`, `teacher`, `content-creator`, `business-owner`, `consultant`, `project-manager`, `financial-analyst`, `ecommerce-owner`, `designer`, `engineer`, `architect`, `freelancer`, `restaurant-owner`, `hotel-tourism`, `student`, `customer-support`, `operations-manager`, `insurance-agent`, `photographer`, `copywriter`, `seo-specialist`, `social-media-manager`

Skills: `writing`, `coding`, `research`, `analysis`, `communication`, `marketing`, `sales`, `automation`, `productivity`, `creative`

## Style rules

1. Text-only. Never reference videos or screenshots.
2. Every lesson solves ONE meaningful real-work problem. Small and specific beats broad.
3. Bring-Your-Own-Account: the learner always uses their own AI account/subscription. Never imply the platform provides AI access. Exercises say "in your own <tool> account".
4. Grounded, current, accurate: use the research notes provided. Name real features (e.g. Claude Projects, plan mode, MCP). If a fact is uncertain, write the workflow generically instead of inventing product claims.
5. Professional tone, plain language, no hype. Write for a busy professional.
6. Prompts must be genuinely excellent — specific, constrained, with anti-hallucination guardrails where relevant ("Use only facts contained in the notes. Do not invent…").
7. Cross-tag honestly: a Claude writing lesson useful to real estate gets `professions: ["real-estate-agent"]` etc. Tag 0-3 professions per tool lesson; tag every profession lesson with its profession.
8. Escape all JSON properly. No trailing commas. Output must parse with JSON.parse.
