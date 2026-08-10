import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, profiles, subscriptions } from "@/db/schema";

const COOKIE = "skillstack_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  db.insert(sessions).values({ id: hashToken(token), userId, expiresAt }).run();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86400,
    path: "/",
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const row = db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, hashToken(token)))
    .get();
  if (!row || row.session.expiresAt < now) return null;
  return row.user;
});

export const getUserContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = db.select().from(profiles).where(eq(profiles.userId, user.id)).get() ?? null;
  const subscription =
    db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).get() ?? null;
  return {
    user,
    profile,
    subscription,
    isSubscribed: subscription?.status === "active",
  };
});
