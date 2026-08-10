import type { MetadataRoute } from "next";
import { sqlite } from "@/db";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/pricing", "/tools", "/professions", "/courses", "/signup", "/login"].map(
    (p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })
  );
  const tools = (sqlite.prepare("SELECT slug FROM tools").all() as { slug: string }[]).map((r) => ({
    url: `${BASE}/tools/${r.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));
  const professions = (sqlite.prepare("SELECT slug FROM professions").all() as { slug: string }[]).map(
    (r) => ({
      url: `${BASE}/professions/${r.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })
  );
  const lessons = (
    sqlite.prepare("SELECT slug, updated_at FROM lessons").all() as { slug: string; updated_at: string }[]
  ).map((r) => ({
    url: `${BASE}/lessons/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...statics, ...tools, ...professions, ...lessons];
}
