import type { ReactNode } from "react";

/**
 * Minimal server-rendered HTML syntax highlighting for theory snippets.
 * Tokenizes comments, tags, attribute names and quoted values — enough for
 * teaching snippets without pulling in a highlighter dependency.
 */
function highlightHtml(source: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  const push = (cls: string | null, text: string) => {
    if (!text) return;
    out.push(
      cls ? (
        <span key={key++} className={cls}>
          {text}
        </span>
      ) : (
        <span key={key++}>{text}</span>
      )
    );
  };

  const re = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const chunk = m[0];
    if (chunk.startsWith("<!--")) {
      push("text-white/40 italic", chunk);
    } else if (chunk.startsWith("<")) {
      // Split the tag into name / attributes / strings.
      const inner = /^(<\/?)([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*?)(\/?>)$/.exec(chunk);
      if (!inner) {
        push(null, chunk);
        continue;
      }
      push("text-[#8ab4ff]", inner[1] + inner[2]);
      const attrs = inner[3];
      const attrRe = /("[^"]*"|'[^']*')|([a-zA-Z-]+)(?==)|([a-zA-Z-]+)|(\s+|=)/g;
      let a: RegExpExecArray | null;
      while ((a = attrRe.exec(attrs)) !== null) {
        if (a[1]) push("text-[#a8d8a8]", a[1]);
        else if (a[2]) push("text-[#ffc98a]", a[2]);
        else if (a[3]) push("text-[#ffc98a]", a[3]);
        else push(null, a[0]);
      }
      push("text-[#8ab4ff]", inner[4]);
    } else {
      push(null, chunk);
    }
  }
  return out;
}

export function CodeSnippet({ code }: { code: string }) {
  return (
    <pre className="prompt-surface overflow-x-auto rounded-xl p-4 font-mono text-xs leading-5">
      <code>{highlightHtml(code)}</code>
    </pre>
  );
}
