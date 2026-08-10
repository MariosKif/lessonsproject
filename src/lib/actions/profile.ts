"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";
import { professionNames } from "@/lib/tool-meta";

export type ProfileFormState = { error?: string; success?: string };

const SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const professionSlug = String(formData.get("profession") ?? "") || null;
  const skillLevel = String(formData.get("skillLevel") ?? "beginner");

  if (!name || name.length < 2) return { error: "Please enter your name (at least 2 characters)." };
  if (professionSlug && !professionNames.has(professionSlug)) return { error: "Unknown profession." };
  if (!SKILL_LEVELS.has(skillLevel)) return { error: "Unknown skill level." };

  db.update(users).set({ name }).where(eq(users.id, user.id)).run();
  db.update(profiles).set({ professionSlug, skillLevel }).where(eq(profiles.userId, user.id)).run();
  revalidatePath("/app", "layout");
  return { success: "Profile updated." };
}

export async function changePasswordAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const row = db.select().from(users).where(eq(users.id, user.id)).get();
  if (!row || !verifyPassword(current, row.passwordHash)) {
    return { error: "Your current password is incorrect." };
  }
  if (next.length < 8) return { error: "The new password must be at least 8 characters." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (next === current) return { error: "The new password must be different from the current one." };

  db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id)).run();
  return { success: "Password changed." };
}

export async function deleteAccountAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (confirmEmail !== user.email.toLowerCase()) {
    return { error: "Type your account email exactly to confirm deletion." };
  }

  // users cascades to sessions, profiles, subscriptions, progress, bookmarks,
  // recently_viewed and provider_connections via FK onDelete: cascade.
  db.delete(users).where(eq(users.id, user.id)).run();
  await destroySession();
  redirect("/");
}
