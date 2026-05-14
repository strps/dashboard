import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { verifySession } from "@/lib/dal/session";

import { SettingsNav } from "./SettingsNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await verifySession();

  if (!isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <Link
          href="/"
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Back to dashboard"
        >
          <ChevronLeft size={14} className="text-white/60" />
        </Link>
        <h1 className="text-sm font-medium tracking-wide text-white/70">
          Settings
        </h1>
      </header>
      <div className="flex">
        <SettingsNav />
        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
