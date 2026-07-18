"use client";

import { Loader2, Search } from "lucide-react";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  departments: readonly string[];
  totalFetched: number;
  totalCount: number;
  isFetching: boolean;
}

export function Toolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  departments,
  totalFetched,
  totalCount,
  isFetching,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Team Hierarchy</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <span className="font-mono tabular-nums">{totalFetched.toLocaleString()}</span>
            <span>of</span>
            <span className="font-mono tabular-nums">{totalCount.toLocaleString()}</span>
            <span>managers loaded</span>
            {isFetching && <Loader2 className="size-3 animate-spin text-accent" />}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, email, ID…"
              className="h-8 w-56 rounded-md border border-border bg-canvas pl-8 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-soft"
            />
          </div>

          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="h-8 cursor-pointer rounded-md border border-border bg-canvas px-2.5 text-xs text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
