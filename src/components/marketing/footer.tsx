import Link from "next/link";
import { Wordmark } from "./nav";

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-mist bg-sheet">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark className="text-lg" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            One subscription for learning how to use every major AI tool — practical text lessons
            organized by tool, profession, skill and difficulty.
          </p>
        </div>
        <nav className="text-sm">
          <p className="mb-3 font-semibold text-ink">Learn</p>
          <ul className="space-y-2 text-ink-soft">
            <li><Link href="/tools" className="hover:text-ink">AI tool academies</Link></li>
            <li><Link href="/professions" className="hover:text-ink">Profession paths</Link></li>
            <li><Link href="/courses" className="hover:text-ink">Claude courses</Link></li>
            <li><Link href="/pricing" className="hover:text-ink">Pricing</Link></li>
          </ul>
        </nav>
        <nav className="text-sm">
          <p className="mb-3 font-semibold text-ink">Account</p>
          <ul className="space-y-2 text-ink-soft">
            <li><Link href="/signup" className="hover:text-ink">Create account</Link></li>
            <li><Link href="/login" className="hover:text-ink">Log in</Link></li>
            <li><Link href="/app" className="hover:text-ink">My learning</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-mist py-4 text-center text-xs text-ink-soft">
        SkillStack · Text-only AI education · You learn with your own AI accounts — we never resell AI access.
      </div>
    </footer>
  );
}
