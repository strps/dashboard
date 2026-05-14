"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

const ITEMS = [
  { href: "/settings/security", label: "Security", Icon: Shield },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="w-56 shrink-0 border-r border-white/10 bg-white/[0.02] p-3 flex flex-col gap-1 min-h-[calc(100vh-57px)]">
      {ITEMS.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5",
            ].join(" ")}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
