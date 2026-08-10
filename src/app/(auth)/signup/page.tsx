import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="display mb-1 text-xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Free preview lessons included — no card required.
      </p>
      <AuthForm action={registerAction} mode="signup" />
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already learning here?{" "}
        <Link href="/login" className="font-medium text-cobalt hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
