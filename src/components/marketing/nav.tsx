import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex items-center gap-2 font-bold ${className}`}>
      <span aria-hidden className="inline-flex flex-col gap-[3px]">
        <span className="h-[3px] w-5 rounded-full bg-spark" />
        <span className="h-[3px] w-5 rounded-full bg-cobalt" />
        <span className="h-[3px] w-5 rounded-full bg-ultramarine" />
      </span>
      SkillStack
    </span>
  );
}

export async function MarketingNav() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-mist bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          <Link href="/tools" className="hover:text-ink">AI tools</Link>
          <Link href="/technologies" className="hover:text-ink">Technologies</Link>
          <Link href="/professions" className="hover:text-ink">Professions</Link>
          <Link href="/courses" className="hover:text-ink">Courses</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/app"
              className="rounded-lg bg-ultramarine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
            >
              Open my learning
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-ultramarine px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
              >
                Start learning
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
