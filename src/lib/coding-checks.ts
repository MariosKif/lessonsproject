import type { CodingCheck, CodingTask } from "@/db/schema";

export type TaskResult = { id: string; pass: boolean; message: string };
export type LintMessage = { level: "error" | "warning"; message: string };

/** Runs one declarative check against the learner's source + parsed document. */
function runCheck(check: CodingCheck, source: string, doc: Document): boolean {
  try {
    switch (check.type) {
      case "doctype":
        return /^\s*<!doctype\s+html\s*>/i.test(source);
      case "selector":
        return doc.querySelector(check.selector) !== null;
      case "selectorCount":
        return doc.querySelectorAll(check.selector).length >= check.min;
      case "attr": {
        const el = doc.querySelector(check.selector);
        if (!el) return false;
        const val = el.getAttribute(check.attr);
        if (val === null) return false;
        if (check.value !== undefined) return val.trim().toLowerCase() === check.value.trim().toLowerCase();
        if (check.pattern !== undefined) return new RegExp(check.pattern, "i").test(val);
        return true;
      }
      case "text": {
        const el = doc.querySelector(check.selector);
        if (!el) return false;
        return new RegExp(check.pattern, "i").test(el.textContent ?? "");
      }
      case "source":
        return new RegExp(check.pattern, "i").test(source);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function runTasks(tasks: CodingTask[], source: string): TaskResult[] {
  const doc = new DOMParser().parseFromString(source, "text/html");
  return tasks.map((t) => ({
    id: t.id,
    pass: runCheck(t.check, source, doc),
    message: t.errorMessage,
  }));
}

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);
// Elements the HTML parser auto-closes in common flows; skip them in the balance check
// to avoid false alarms (their closing tag is genuinely optional).
const OPTIONAL_CLOSE = new Set(["li", "p", "td", "th", "tr", "option", "dt", "dd", "thead", "tbody", "tfoot"]);

/**
 * Lightweight linter for the feedback console. Intentionally small: it catches the
 * mistakes beginners actually make, not everything the W3C validator would.
 */
export function lintHtml(source: string): LintMessage[] {
  const messages: LintMessage[] = [];
  const stripped = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|pre|textarea)[\s\S]*?<\/\1\s*>/gi, "<$1></$1>");

  if (!/^\s*<!doctype\s+html\s*>/i.test(source)) {
    messages.push({ level: "warning", message: "Missing <!DOCTYPE html> on the first line — browsers may fall back to quirks mode." });
  }

  // Tag balance via a simple stack.
  const stack: { tag: string; index: number }[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(stripped)) !== null) {
    const raw = m[0];
    const tag = m[1].toLowerCase();
    if (raw.startsWith("</")) {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].tag !== tag) i--;
      if (i === -1) {
        messages.push({ level: "error", message: `Closing </${tag}> has no matching opening tag.` });
      } else {
        for (let j = stack.length - 1; j > i; j--) {
          if (!OPTIONAL_CLOSE.has(stack[j].tag)) {
            messages.push({ level: "error", message: `<${stack[j].tag}> is never closed — add </${stack[j].tag}>.` });
          }
        }
        stack.length = i;
      }
    } else if (!VOID_ELEMENTS.has(tag) && !raw.endsWith("/>")) {
      stack.push({ tag, index: m.index });
    }
  }
  for (const open of stack) {
    if (!OPTIONAL_CLOSE.has(open.tag)) {
      messages.push({ level: "error", message: `<${open.tag}> is never closed — add </${open.tag}>.` });
    }
  }

  const doc = new DOMParser().parseFromString(source, "text/html");

  for (const img of Array.from(doc.querySelectorAll("img"))) {
    if (!img.hasAttribute("alt")) {
      messages.push({ level: "warning", message: `<img src="${img.getAttribute("src") ?? ""}"> is missing an alt attribute.` });
    }
  }
  for (const iframe of Array.from(doc.querySelectorAll("iframe"))) {
    if (!iframe.hasAttribute("title")) {
      messages.push({ level: "warning", message: "An <iframe> is missing a title attribute (needed for screen readers)." });
    }
  }
  const ids = new Map<string, number>();
  for (const el of Array.from(doc.querySelectorAll("[id]"))) {
    const id = el.getAttribute("id")!;
    ids.set(id, (ids.get(id) ?? 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) messages.push({ level: "warning", message: `Duplicate id "${id}" — ids must be unique on a page.` });
  }
  const h1s = doc.querySelectorAll("h1").length;
  if (h1s > 1) messages.push({ level: "warning", message: `Page has ${h1s} <h1> elements — keep exactly one.` });
  if (doc.querySelectorAll("html").length > 0 && !doc.documentElement.getAttribute("lang") && /<html/i.test(source)) {
    messages.push({ level: "warning", message: "The <html> element has no lang attribute (e.g. lang=\"en\")." });
  }

  // Deduplicate identical messages.
  const seen = new Set<string>();
  return messages.filter((msg) => {
    const key = msg.level + msg.message;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
