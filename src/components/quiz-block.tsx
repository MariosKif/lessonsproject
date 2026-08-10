"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/db/schema";

/**
 * One question at a time: pick an answer → instant right/wrong + explanation →
 * "Next question" slides the next card in. Ends with a score screen.
 */
export function QuizBlock({ questions }: { questions: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[current];
  const answered = chosen !== null;
  const wasCorrect = answered && chosen === question.answer;

  function pick(oi: number) {
    if (answered) return;
    setChosen(oi);
    if (oi === question.answer) setScore((s) => s + 1);
  }

  function next() {
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setChosen(null);
    }
  }

  function restart() {
    setCurrent(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const perfect = score === total;
    const good = score >= Math.ceil(total * 0.66);
    return (
      <div className="quiz-result-pop rounded-2xl border border-mist bg-sheet p-8 text-center">
        <p className="text-4xl" aria-hidden>
          {perfect ? "🏆" : good ? "🎉" : "📖"}
        </p>
        <p className="display mt-3 text-2xl font-bold">
          {score}/{total} correct
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          {perfect
            ? "Perfect score — you've got this workflow down. Mark the lesson complete."
            : good
              ? "Solid. Skim the explanations you missed, then mark the lesson complete."
              : "Worth one more pass — reread the lesson's steps and prompt, then try the quiz again."}
        </p>
        <button
          onClick={restart}
          className="mt-5 rounded-lg border border-mist bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-cobalt/40"
        >
          Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden>
          {questions.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-8 rounded-full transition-colors duration-300"
              style={{
                background:
                  i < current || (i === current && answered)
                    ? "var(--cobalt)"
                    : i === current
                      ? "var(--ultramarine)"
                      : "var(--mist)",
                opacity: i === current ? 1 : 0.9,
              }}
            />
          ))}
        </div>
        <span className="font-mono text-xs text-ink-soft">
          {current + 1} / {total}
        </span>
      </div>

      {/* Question card — keyed remount triggers the slide-in animation */}
      <div key={current} className="quiz-card-enter rounded-2xl border border-mist bg-sheet p-6">
        <p className="font-medium leading-relaxed">{question.q}</p>
        <div className="mt-4 space-y-2">
          {question.options.map((opt, oi) => {
            const isChosen = chosen === oi;
            const isCorrect = oi === question.answer;
            let style = "border-mist bg-paper hover:border-cobalt hover:bg-cobalt/5 cursor-pointer";
            if (answered) {
              if (isCorrect) style = "border-moss bg-moss/10";
              else if (isChosen) style = "border-spark bg-spark/10";
              else style = "border-mist bg-paper opacity-50";
            }
            return (
              <button
                key={oi}
                type="button"
                onClick={() => pick(oi)}
                disabled={answered}
                className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200 ${style}`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    answered && isCorrect
                      ? "border-moss bg-moss text-white"
                      : answered && isChosen
                        ? "border-spark bg-spark text-white"
                        : "border-mist bg-sheet text-ink-soft"
                  }`}
                  aria-hidden
                >
                  {answered && isCorrect ? "✓" : answered && isChosen ? "✕" : String.fromCharCode(65 + oi)}
                </span>
                <span className="leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="quiz-result-pop mt-4">
            <p
              className={`display text-base font-bold ${wasCorrect ? "text-moss" : "text-spark"}`}
            >
              {wasCorrect ? "Correct ✓" : "Not quite ✕"}
            </p>
            <p
              className={`mt-2 rounded-lg px-4 py-3 text-sm leading-relaxed ${
                wasCorrect ? "bg-moss/5 text-ink" : "bg-spark/5 text-ink"
              }`}
            >
              {question.why}
            </p>
            <button
              onClick={next}
              className="mt-4 w-full rounded-lg bg-ultramarine py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt sm:w-auto sm:px-6"
            >
              {current + 1 >= total ? "See my score" : "Next question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
