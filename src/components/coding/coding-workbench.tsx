"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodingData } from "@/db/schema";
import { lintHtml, runTasks, type LintMessage, type TaskResult } from "@/lib/coding-checks";

type RuntimeError = { message: string; line?: number };

const ERROR_BRIDGE = `<script>
window.onerror = function (msg, src, line) {
  parent.postMessage({ __skillstack: true, type: "runtime-error", message: String(msg), line: line }, "*");
};
console.error = (function (orig) {
  return function () {
    parent.postMessage({ __skillstack: true, type: "runtime-error", message: Array.prototype.map.call(arguments, String).join(" ") }, "*");
    orig.apply(console, arguments);
  };
})(console.error);
</script>`;

function storageKey(slug: string) {
  return `skillstack-code:${slug}`;
}

/**
 * Injects the error bridge BEFORE any user script runs (inside <head>, or right
 * after the doctype), so window.onerror is installed early — while keeping the
 * doctype first so the preview stays in standards mode.
 */
function withErrorBridge(source: string): string {
  if (/<head[^>]*>/i.test(source)) return source.replace(/<head([^>]*)>/i, (m) => m + ERROR_BRIDGE);
  const doctype = source.match(/^\s*<!doctype[^>]*>/i);
  if (doctype) {
    return source.slice(0, doctype[0].length) + ERROR_BRIDGE + source.slice(doctype[0].length);
  }
  return ERROR_BRIDGE + source;
}

export function CodingWorkbench({ slug, coding }: { slug: string; coding: CodingData }) {
  const [code, setCode] = useState(coding.starterCode);
  const [tab, setTab] = useState<"code" | "result">("code");
  const [results, setResults] = useState<TaskResult[] | null>(null);
  const [lint, setLint] = useState<LintMessage[]>([]);
  const [runtimeErrors, setRuntimeErrors] = useState<RuntimeError[]>([]);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [openHints, setOpenHints] = useState<Set<string>>(new Set());
  const [solutionLoaded, setSolutionLoaded] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  // The learner's own code, stashed while the solution is displayed.
  const stashedCode = useRef<string | null>(null);

  // Restore saved work once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(slug));
      if (saved) setCode(saved);
    } catch {}
  }, [slug]);

  // Collect runtime errors reported by the sandboxed preview.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data && e.data.__skillstack && e.data.type === "runtime-error") {
        setRuntimeErrors((prev) =>
          prev.length >= 20 ? prev : [...prev, { message: e.data.message, line: e.data.line }]
        );
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const persist = useCallback(
    (value: string) => {
      try {
        localStorage.setItem(storageKey(slug), value);
      } catch {}
    },
    [slug]
  );

  // Checks + preview without saving: used while the solution is on display so the
  // learner's own saved code is never overwritten.
  const runPreviewOnly = useCallback(
    (source: string) => {
      setRuntimeErrors([]);
      setResults(runTasks(coding.tasks, source));
      setLint(lintHtml(source));
      setPreviewDoc(withErrorBridge(source));
      setTab("result");
    },
    [coding.tasks]
  );

  const run = useCallback(
    (source: string) => {
      runPreviewOnly(source);
      persist(source);
    },
    [runPreviewOnly, persist]
  );

  const onEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      // execCommand keeps the cursor position and the undo stack intact and fires
      // an input event so React state stays in sync; fall back to manual insertion.
      const inserted = document.execCommand?.("insertText", false, "  ");
      if (!inserted) {
        const { selectionStart: s, selectionEnd: end, value } = el;
        setCode(value.slice(0, s) + "  " + value.slice(end));
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = s + 2;
        });
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run(e.currentTarget.value);
    }
  }, [run]);

  const passed = useMemo(() => (results ? results.filter((r) => r.pass).length : 0), [results]);
  const allPassed = results !== null && passed === coding.tasks.length;
  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Top row: editor / live preview */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-mist bg-sheet">
        <div className="flex items-center gap-1 border-b border-mist px-3 py-2">
          <button
            type="button"
            onClick={() => setTab("code")}
            className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold ${
              tab === "code" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            index.html
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewDoc(withErrorBridge(code));
              setTab("result");
            }}
            className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold ${
              tab === "result" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            Result
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (solutionLoaded) {
                  const restored = stashedCode.current ?? coding.starterCode;
                  stashedCode.current = null;
                  setCode(restored);
                  setSolutionLoaded(false);
                  run(restored);
                } else {
                  stashedCode.current = code;
                  setCode(coding.solutionCode);
                  setSolutionLoaded(true);
                  runPreviewOnly(coding.solutionCode);
                }
              }}
              className="rounded-md border border-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-cobalt/40 hover:text-ink"
            >
              {solutionLoaded ? "Back to my code" : "Show solution"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCode(coding.starterCode);
                setSolutionLoaded(false);
                setResults(null);
                setLint([]);
                setRuntimeErrors([]);
                setPreviewDoc(null);
                setTab("code");
                try {
                  localStorage.removeItem(storageKey(slug));
                } catch {}
              }}
              className="rounded-md border border-mist px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-spark/50 hover:text-spark"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => run(code)}
              className="rounded-md bg-ultramarine px-4 py-1.5 text-xs font-semibold text-white hover:bg-cobalt"
            >
              ▶ Run
            </button>
          </div>
        </div>

        {tab === "code" ? (
          <div className="prompt-surface flex min-h-0 flex-1 overflow-auto rounded-none">
            <pre
              aria-hidden
              className="select-none border-r border-white/10 px-2 py-3 text-right font-mono text-xs leading-5 text-white/30"
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
            </pre>
            <textarea
              ref={editorRef}
              value={code}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => {
                setCode(e.target.value);
                setSolutionLoaded(false);
              }}
              onKeyDown={onEditorKeyDown}
              aria-label="HTML code editor"
              className="min-h-full w-full flex-1 resize-none bg-transparent px-3 py-3 font-mono text-xs leading-5 text-inherit outline-none"
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 bg-white">
            {previewDoc !== null ? (
              <iframe
                title="Live preview of your HTML"
                sandbox="allow-scripts allow-modals"
                srcDoc={previewDoc}
                className="h-full w-full"
              />
            ) : (
              <p className="p-6 text-sm text-ink-soft">Press Run to render your page here.</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: feedback console */}
      <div className="flex h-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-mist bg-sheet">
        <div className="flex items-center gap-2 border-b border-mist px-4 py-2">
          <span className="font-mono text-xs font-semibold text-ink-soft">Feedback console</span>
          {results !== null && (
            <span
              className={`ml-auto rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
                allPassed ? "bg-moss/10 text-moss" : "bg-spark/10 text-spark"
              }`}
            >
              {passed}/{coding.tasks.length} checks passing
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-3 text-sm">
          {results === null ? (
            <p className="text-ink-soft">
              Work through the tasks below, then press <strong>Run</strong> (or Ctrl/Cmd+Enter) to
              check your code and see the result.
            </p>
          ) : allPassed ? (
            <p className="rounded-lg bg-moss/10 px-3 py-2 font-medium text-moss">
              ✓ All checks pass — great work. Compare with the solution, then mark the lesson
              complete below.
            </p>
          ) : null}

          <ul className="space-y-2">
            {coding.tasks.map((t, i) => {
              const r = results?.find((x) => x.id === t.id);
              const state = r === undefined ? "todo" : r.pass ? "pass" : "fail";
              return (
                <li key={t.id} className="rounded-lg border border-mist/70 px-3 py-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className={`mt-0.5 font-mono text-xs font-bold ${
                        state === "pass" ? "text-moss" : state === "fail" ? "text-spark" : "text-ink-soft"
                      }`}
                    >
                      {state === "pass" ? "✓" : state === "fail" ? "✕" : String(i + 1) + "."}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={state === "pass" ? "text-ink-soft line-through decoration-moss/40" : ""}>
                        {t.instruction}
                      </p>
                      {state === "fail" && (
                        <p className="mt-1 font-mono text-xs text-spark">{r!.message}</p>
                      )}
                      {state !== "pass" && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenHints((prev) => {
                              const next = new Set(prev);
                              if (next.has(t.id)) next.delete(t.id);
                              else next.add(t.id);
                              return next;
                            })
                          }
                          className="mt-1 text-xs font-medium text-cobalt hover:underline"
                        >
                          {openHints.has(t.id) ? "Hide hint" : "Show hint"}
                        </button>
                      )}
                      {openHints.has(t.id) && state !== "pass" && (
                        <p className="mt-1 rounded-md bg-ultramarine/5 px-2.5 py-1.5 text-xs text-ink">
                          {t.hint}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {lint.length > 0 && (
            <div>
              <p className="mb-1 font-mono text-xs font-semibold text-ink-soft">HTML warnings</p>
              <ul className="space-y-1">
                {lint.map((l, i) => (
                  <li
                    key={i}
                    className={`font-mono text-xs ${l.level === "error" ? "text-spark" : "text-ink-soft"}`}
                  >
                    {l.level === "error" ? "✕" : "⚠"} {l.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {runtimeErrors.length > 0 && (
            <div>
              <p className="mb-1 font-mono text-xs font-semibold text-spark">JavaScript errors</p>
              <ul className="space-y-1">
                {runtimeErrors.map((err, i) => (
                  <li key={i} className="font-mono text-xs text-spark">
                    ✕ {err.message}
                    {err.line ? ` (line ${err.line})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
