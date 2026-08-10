"use client";

import { useActionState } from "react";
import type { AuthState } from "@/lib/auth/actions";

const inputClass =
  "w-full rounded-lg border border-mist bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-cobalt";

export function AuthForm({
  action,
  mode,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "signup";
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
          <input id="name" name="name" required minLength={2} className={inputClass} placeholder="Maria Papadopoulou" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@work.com" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClass} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} />
      </div>
      {state.error && (
        <p className="rounded-lg bg-spark/10 px-3 py-2 text-sm text-spark" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-ultramarine py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt disabled:opacity-60"
      >
        {pending ? "One moment…" : mode === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
