import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="display mb-1 text-xl font-bold">Welcome back</h1>
      <p className="mb-6 text-sm text-ink-soft">Continue your learning.</p>
      <AuthForm action={loginAction} mode="login" />
      <p className="mt-6 text-center text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-cobalt hover:underline">
          Start learning
        </Link>
      </p>
    </>
  );
}
