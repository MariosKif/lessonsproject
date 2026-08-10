import Link from "next/link";
import { Wordmark } from "@/components/marketing/nav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-xl">
        <Wordmark />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-mist bg-sheet p-8 shadow-[0_12px_40px_-20px_rgba(23,26,33,0.25)]">
        {children}
      </div>
    </div>
  );
}
