import Link from "next/link";
import type { SimpleIcon } from "simple-icons";
import {
  siHtml5, siCss, siJavascript, siTypescript, siReact, siNextdotjs, siVuedotjs,
  siAngular, siSvelte, siTailwindcss, siBootstrap, siSass, siNodedotjs, siExpress,
  siNestjs, siPython, siDjango, siFlask, siOpenjdk, siSpring, siKotlin, siSwift,
  siPhp, siLaravel, siRuby, siRubyonrails, siGo, siRust, siCplusplus, siSharp,
  siDocker, siKubernetes, siGit, siGithub, siPostgresql, siMysql, siMongodb,
  siRedis, siGraphql, siFlutter,
} from "simple-icons";

const TECHS: { label: string; icon: SimpleIcon; href?: string }[] = [
  { label: "HTML", icon: siHtml5, href: "/tools/html" },
  { label: "CSS", icon: siCss },
  { label: "JavaScript", icon: siJavascript },
  { label: "TypeScript", icon: siTypescript },
  { label: "React", icon: siReact },
  { label: "Next.js", icon: siNextdotjs },
  { label: "Vue.js", icon: siVuedotjs },
  { label: "Angular", icon: siAngular },
  { label: "Svelte", icon: siSvelte },
  { label: "Tailwind CSS", icon: siTailwindcss },
  { label: "Bootstrap", icon: siBootstrap },
  { label: "Sass", icon: siSass },
  { label: "Node.js", icon: siNodedotjs },
  { label: "Express", icon: siExpress },
  { label: "NestJS", icon: siNestjs },
  { label: "Python", icon: siPython },
  { label: "Django", icon: siDjango },
  { label: "Flask", icon: siFlask },
  { label: "Java", icon: siOpenjdk },
  { label: "Spring", icon: siSpring },
  { label: "Kotlin", icon: siKotlin },
  { label: "Swift", icon: siSwift },
  { label: "PHP", icon: siPhp },
  { label: "Laravel", icon: siLaravel },
  { label: "Ruby", icon: siRuby },
  { label: "Rails", icon: siRubyonrails },
  { label: "Go", icon: siGo },
  { label: "Rust", icon: siRust },
  { label: "C++", icon: siCplusplus },
  { label: "C#", icon: siSharp },
  { label: "Docker", icon: siDocker },
  { label: "Kubernetes", icon: siKubernetes },
  { label: "Git", icon: siGit },
  { label: "GitHub", icon: siGithub },
  { label: "PostgreSQL", icon: siPostgresql },
  { label: "MySQL", icon: siMysql },
  { label: "MongoDB", icon: siMongodb },
  { label: "Redis", icon: siRedis },
  { label: "GraphQL", icon: siGraphql },
  { label: "Flutter", icon: siFlutter },
];

/** Top-40 technology courses — live ones link to their academy, the rest are "coming soon". */
export function TechGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {TECHS.map(({ label, icon, href }) => {
        const inner = (
          <>
            <svg
              role="img"
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0"
              fill={`#${icon.hex}`}
            >
              <path d={icon.path} />
            </svg>
            <span className="min-w-0">
              <span className="display block truncate text-sm font-semibold text-ink">{label}</span>
              {href ? (
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-moss">
                  Available now
                </span>
              ) : (
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-spark">
                  Coming soon
                </span>
              )}
            </span>
          </>
        );
        return href ? (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-moss/40 bg-sheet px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-moss hover:shadow-[0_8px_24px_-12px_rgba(30,122,90,0.35)]"
          >
            {inner}
          </Link>
        ) : (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-mist bg-sheet px-4 py-3.5"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
