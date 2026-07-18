"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Table, Network } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Workforce Directory", icon: Table },
  { href: "/team-hierarchy", label: "Team Hierarchy", icon: Network },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-surface px-4">
      <span className="mr-3 text-xs font-bold uppercase tracking-widest text-accent">
        DataGrid
      </span>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-accent-soft text-accent-hover"
                : "text-ink-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
