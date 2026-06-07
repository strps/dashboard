"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, type LucideIcon } from "lucide-react";

import { MODULES } from "@/dashboard/modules";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
}

const ADMIN_ITEMS: NavItem[] = [
  {
    href: "/settings/security",
    label: "Dashboard Configuration",
    Icon: Settings,
    adminOnly: true,
  },
];

interface NavGroup {
  label: string;
  Icon?: LucideIcon;
  items: NavItem[];
}

function buildModuleGroups(): NavGroup[] {
  return MODULES.filter((m) => m.configPages && m.configPages.length > 0).map(
    (m) => ({
      label: m.label,
      Icon: m.icon,
      items: m.configPages!.map((p) => ({
        href: `/settings/${m.id}/${p.slug}`,
        label: p.label,
        Icon: p.icon ?? Settings,
        adminOnly: p.adminOnly,
      })),
    }),
  );
}

interface SettingsNavProps {
  isAdmin: boolean;
}

export function SettingsNav({ isAdmin }: SettingsNavProps) {
  const pathname = usePathname();
  const moduleGroups = buildModuleGroups();
  const filteredModuleGroups = moduleGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => isAdmin || !i.adminOnly),
    }))
    .filter((g) => g.items.length > 0);

  const groups: NavGroup[] = [...filteredModuleGroups];
  if (isAdmin) {
    groups.push({ label: "Admin", items: ADMIN_ITEMS });
  }

  return (
    <nav className="w-56 shrink-0 border-r border-white/10 bg-white/2 p-3 flex flex-col gap-3 min-h-[calc(100vh-57px)]">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 px-3 pt-1 pb-1 text-[10px] uppercase tracking-widest text-white/30">
            {group.Icon && <group.Icon size={11} />}
            {group.label}
          </div>
          {group.items.map(({ href, label, Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
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
        </div>
      ))}
    </nav>
  );
}
