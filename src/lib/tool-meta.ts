import taxonomy from "../../content/taxonomy.json";

export type ToolMeta = { slug: string; name: string; color: string; category: string; type: string };

const map = new Map<string, ToolMeta>(
  taxonomy.tools.map((t) => [
    t.slug,
    { slug: t.slug, name: t.name, color: t.color, category: t.category, type: t.type ?? "ai-tool" },
  ])
);

export function toolMeta(slug: string): ToolMeta {
  return map.get(slug) ?? { slug, name: slug, color: "#4b4f5c", category: "assistant", type: "ai-tool" };
}

export const professionNames = new Map(taxonomy.professions.map((p) => [p.slug, p.name]));
export const skillNames = new Map(taxonomy.skills.map((s) => [s.slug, s.name]));
