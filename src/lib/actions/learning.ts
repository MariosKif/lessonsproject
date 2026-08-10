"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { progress, bookmarks, providerConnections, profiles, subscriptions, tools } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function toggleCompleteAction(lessonSlug: string) {
  const user = await requireUser();
  const existing = db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, user.id), eq(progress.lessonSlug, lessonSlug)))
    .get();
  if (existing) {
    db.delete(progress).where(and(eq(progress.userId, user.id), eq(progress.lessonSlug, lessonSlug))).run();
  } else {
    db.insert(progress).values({ userId: user.id, lessonSlug, completedAt: new Date().toISOString() }).run();
  }
  revalidatePath("/app", "layout");
}

export async function toggleBookmarkAction(lessonSlug: string) {
  const user = await requireUser();
  const existing = db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, user.id), eq(bookmarks.lessonSlug, lessonSlug)))
    .get();
  if (existing) {
    db.delete(bookmarks).where(and(eq(bookmarks.userId, user.id), eq(bookmarks.lessonSlug, lessonSlug))).run();
  } else {
    db.insert(bookmarks).values({ userId: user.id, lessonSlug, createdAt: new Date().toISOString() }).run();
  }
  revalidatePath("/app", "layout");
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  const professionSlug = String(formData.get("profession") ?? "") || null;
  const skillLevel = String(formData.get("skillLevel") ?? "beginner");
  const toolsUsed = formData.getAll("toolsUsed").map(String);
  const toolsToLearn = formData.getAll("toolsToLearn").map(String);
  const goals = formData.getAll("goals").map(String);

  db.update(profiles)
    .set({ professionSlug, skillLevel, toolsUsed, toolsToLearn, goals, onboarded: true })
    .where(eq(profiles.userId, user.id))
    .run();
  redirect("/app");
}

export async function toggleConnectionAction(toolSlug: string) {
  const user = await requireUser();
  const tool = db.select().from(tools).where(eq(tools.slug, toolSlug)).get();
  if (!tool || tool.connectMode !== "own-allowance") return;
  const existing = db
    .select()
    .from(providerConnections)
    .where(and(eq(providerConnections.userId, user.id), eq(providerConnections.toolSlug, toolSlug)))
    .get();
  if (existing?.status === "connected") {
    db.update(providerConnections)
      .set({ status: "disconnected", connectedAt: null })
      .where(and(eq(providerConnections.userId, user.id), eq(providerConnections.toolSlug, toolSlug)))
      .run();
  } else {
    db.insert(providerConnections)
      .values({ userId: user.id, toolSlug, status: "connected", connectedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: [providerConnections.userId, providerConnections.toolSlug],
        set: { status: "connected", connectedAt: new Date().toISOString() },
      })
      .run();
  }
  revalidatePath("/app/profile");
}

/** Local mock of the €5.99/month checkout. Swap for a real payment provider on deploy. */
export async function subscribeAction() {
  const user = await requireUser();
  const now = new Date();
  const renews = new Date(now);
  renews.setMonth(renews.getMonth() + 1);
  db.update(subscriptions)
    .set({ status: "active", startedAt: now.toISOString(), renewsAt: renews.toISOString() })
    .where(eq(subscriptions.userId, user.id))
    .run();
  revalidatePath("/app", "layout");
  redirect("/app/profile?subscribed=1#subscription");
}

export async function cancelSubscriptionAction() {
  const user = await requireUser();
  db.update(subscriptions)
    .set({ status: "canceled" })
    .where(eq(subscriptions.userId, user.id))
    .run();
  revalidatePath("/app", "layout");
}
