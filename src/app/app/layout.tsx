import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { AppNavLinks } from "@/components/app/sidebar";
import { Wordmark } from "@/components/marketing/nav";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const ctx = await getUserContext();
  if (!ctx) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-mist bg-sheet px-4 py-5 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <Link href="/app">
          <Wordmark className="text-lg" />
        </Link>
        <AppNavLinks />
        <div className="mt-auto space-y-3 border-t border-mist pt-4">
          {!ctx.isSubscribed && (
            <Link
              href="/app/profile#subscription"
              className="block rounded-lg bg-spark/10 px-3 py-2 text-xs font-semibold text-spark hover:bg-spark/15"
            >
              Free preview — subscribe for €5.99/mo
            </Link>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-ink">{ctx.user.name}</span>
            <form action={logoutAction}>
              <button className="text-xs text-ink-soft hover:text-ink">Log out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
