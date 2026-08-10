# Lesson Enrichment Specification

Goal: every lesson must deliver maximum practical value to a customer who has **zero prior
knowledge**. Never assume they know what to write, click, or expect. Be hyper-analytical and
concrete. No generic filler.

For each assigned lesson file `content/lessons/<name>.json`, write
`content/enrichment/<name>.json`:

```json
{ "enrichment": { "<lesson-slug>": {
  "placeholders": [ { "name": "PASTE NOTES", "what": "...", "examples": ["...", "...", "..."] } ],
  "variations":   [ { "label": "...", "whenToUse": "...", "prompt": "..." } ],
  "followUps":    [ { "label": "...", "prompt": "..." } ],
  "walkthrough":  "..."
} } }
```

## placeholders (REQUIRED for every `[PLACEHOLDER]` that appears in the lesson's prompt)

- `name`: exactly the placeholder text between the brackets (e.g. for `[PASTE NOTES]` use `"PASTE NOTES"`). It MUST appear in the lesson's prompt as `[NAME]` — copy it character-for-character.
- `what`: 2-3 sentences explaining, to a total beginner, what belongs here, where to find it, and what makes a good vs bad value.
- `examples`: 2-3 COMPLETE, realistic values the user could genuinely use or adapt — never stubs like "your notes here". If the placeholder wants pasted notes, write a full realistic 4-8 line example of such notes. If it wants a choice (tone, audience, length), give the actual menu of good options (e.g. "Warm and friendly — for repeat clients", "Formal — for corporate buyers", "Direct and brief — for busy executives").
- If the prompt has NO placeholders, omit `placeholders`.

## variations (REQUIRED, exactly 2-3)

Alternative complete prompts for meaningfully different situations — not rewordings. Think: a
faster/shorter version, a more advanced version, a different context (internal vs client-facing,
different output format, different starting material). Each:
- `label`: short name ("Quick version for daily use", "When you only have a photo of the document").
- `whenToUse`: 1-2 sentences, concrete.
- `prompt`: the full ready-to-copy prompt, same quality bar as the main one, with [PLACEHOLDERS] where needed.

## followUps (REQUIRED, exactly 3-4)

Ready-to-paste messages for AFTER the AI's first response — this is where beginners get stuck.
Each targets a specific, common weakness of first outputs for THIS task:
- `label`: what it fixes ("Too long? Cut it in half", "Sounds robotic? Humanize it", "Check it didn't invent anything").
- `prompt`: the complete follow-up message, ready to paste.

## walkthrough (REQUIRED, 180-350 words)

A complete worked run of the lesson written for someone who has never done this before. Use \n\n
between paragraphs. Must include, concretely:
1. The starting situation (a named fictional person with a realistic task).
2. Exactly what they open/click/paste, step by step, including which text goes where.
3. A condensed but realistic version of what the AI answered.
4. Which follow-up they sent and why.
5. The final result and how long the whole thing took.

Style: plain language, no hype, no "simply/just". Explain any term a non-technical person might
not know. Write in second person or about the named person — consistent within the walkthrough.

## Validation you MUST run before finishing

`node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"` passes; every slug in your
output exists in the source lesson file; every lesson in the source file has an enrichment entry;
every `placeholders[].name` appears bracketed in that lesson's `prompt`; variations 2-3 and
followUps 3-4 per lesson; walkthrough 180-350 words.
