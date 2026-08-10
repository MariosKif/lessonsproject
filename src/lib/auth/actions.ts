"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, profiles, subscriptions } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./session";

export type AuthState = { error?: string };

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || name.length < 2) return { error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) return { error: "An account with this email already exists. Try logging in." };

  const id = randomUUID();
  const now = new Date().toISOString();
  db.insert(users).values({ id, email, name, passwordHash: hashPassword(password), createdAt: now }).run();
  db.insert(profiles).values({ userId: id }).run();
  db.insert(subscriptions).values({ userId: id }).run();

  await createSession(id);
  redirect("/onboarding");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  const profile = db.select().from(profiles).where(eq(profiles.userId, user.id)).get();
  redirect(profile?.onboarded ? "/app" : "/onboarding");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
