import { toggleConnectionAction } from "@/lib/actions/learning";

const MODE_COPY: Record<string, { label: string; hint: string }> = {
  "own-allowance": {
    label: "Connect your account",
    hint: "This provider officially supports using your own subscription with third-party learning flows. Your usage stays on your own plan.",
  },
  "external-launch": {
    label: "Opens in the provider's app",
    hint: "Lessons give you the prompt, then open this tool in your own account. No connection needed.",
  },
  "built-in": {
    label: "Built into SkillStack",
    hint: "This course runs entirely inside SkillStack's own editor — nothing to connect.",
  },
  unavailable: {
    label: "No integration available",
    hint: "This provider doesn't currently expose a supported connection. Lessons still teach the full workflow.",
  },
};

type ToolRow = {
  slug: string;
  name: string;
  color: string;
  connectMode: string;
  launchUrl: string | null;
};

type Connection = { toolSlug: string; status: string };

export function ConnectionsList({
  tools,
  connections,
}: {
  tools: ToolRow[];
  connections: Connection[];
}) {
  const bySlug = new Map(connections.map((c) => [c.toolSlug, c]));
  return (
    <ul className="space-y-3">
      {tools.map((t) => {
        const mode = MODE_COPY[t.connectMode] ?? MODE_COPY["external-launch"];
        const isConnected = bySlug.get(t.slug)?.status === "connected";
        return (
          <li
            key={t.slug}
            className="flex flex-col gap-3 rounded-xl border border-mist bg-sheet p-5 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
              <div className="min-w-0">
                <p className="display font-semibold">{t.name}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{mode.hint}</p>
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              {t.connectMode === "own-allowance" ? (
                <form action={toggleConnectionAction.bind(null, t.slug)}>
                  <button
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      isConnected
                        ? "border border-moss/30 bg-moss/10 text-moss hover:bg-moss/15"
                        : "bg-ultramarine text-white hover:bg-cobalt"
                    }`}
                  >
                    {isConnected ? "✓ Connected — disconnect" : "Connect account"}
                  </button>
                </form>
              ) : t.launchUrl ? (
                <a
                  href={t.launchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg border border-mist px-4 py-2 text-sm font-medium text-ink hover:border-cobalt/40"
                >
                  Open {t.name} ↗
                </a>
              ) : (
                <span className="text-xs text-ink-soft">{mode.label}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
