"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Home", exact: true },
  { href: "/app/library", label: "Lesson library" },
  { href: "/app/paths", label: "Learning paths" },
  { href: "/app/my", label: "My learning" },
  { href: "/app/profile", label: "Profile" },
];

export function AppNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-ultramarine text-white" : "text-ink-soft hover:bg-mist/60 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
