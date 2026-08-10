"use client";

import { useActionState, useState } from "react";
import {
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
  type ProfileFormState,
} from "@/lib/actions/profile";

const initialState: ProfileFormState = {};

function StateNote({ state }: { state: ProfileFormState }) {
  if (state.error)
    return <p className="mt-3 rounded-lg bg-spark/10 px-3 py-2 text-sm font-medium text-spark">{state.error}</p>;
  if (state.success)
    return <p className="mt-3 rounded-lg bg-moss/10 px-3 py-2 text-sm font-medium text-moss">✓ {state.success}</p>;
  return null;
}

const inputCls =
  "w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-cobalt/60";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-ink-soft";
const buttonCls =
  "rounded-lg bg-ultramarine px-5 py-2 text-sm font-semibold text-white hover:bg-cobalt disabled:opacity-60";

export function ProfileDetailsForm({
  name,
  professionSlug,
  skillLevel,
  professions,
}: {
  name: string;
  professionSlug: string | null;
  skillLevel: string;
  professions: { slug: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="pf-name" className={labelCls}>
          Name
        </label>
        <input id="pf-name" name="name" defaultValue={name} required minLength={2} className={`mt-1.5 ${inputCls}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-profession" className={labelCls}>
            Profession
          </label>
          <select
            id="pf-profession"
            name="profession"
            defaultValue={professionSlug ?? ""}
            className={`mt-1.5 ${inputCls}`}
          >
            <option value="">Not set</option>
            {professions.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-skill" className={labelCls}>
            AI skill level
          </label>
          <select id="pf-skill" name="skillLevel" defaultValue={skillLevel} className={`mt-1.5 ${inputCls}`}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      <button disabled={pending} className={buttonCls}>
        {pending ? "Saving…" : "Save changes"}
      </button>
      <StateNote state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="pw-current" className={labelCls}>
          Current password
        </label>
        <input
          id="pw-current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className={`mt-1.5 ${inputCls}`}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pw-next" className={labelCls}>
            New password
          </label>
          <input
            id="pw-next"
            name="next"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="pw-confirm" className={labelCls}>
            Repeat new password
          </label>
          <input
            id="pw-confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
      </div>
      <button disabled={pending} className={buttonCls}>
        {pending ? "Changing…" : "Change password"}
      </button>
      <StateNote state={state} />
    </form>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-lg border border-spark/40 px-4 py-2 text-sm font-semibold text-spark hover:bg-spark/10"
      >
        Delete my account…
      </button>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm leading-relaxed text-ink-soft">
        This permanently deletes your account, progress, bookmarks, connections and subscription
        record. There is no undo. Type <strong className="text-ink">{email}</strong> to confirm.
      </p>
      <input
        name="confirmEmail"
        type="email"
        required
        placeholder={email}
        autoComplete="off"
        className={inputCls}
      />
      <div className="flex gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-spark px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Permanently delete account"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="rounded-lg border border-mist px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <StateNote state={state} />
    </form>
  );
}
