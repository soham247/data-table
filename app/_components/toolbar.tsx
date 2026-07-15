"use client";

import { Download, Loader2, Search, X } from "lucide-react";

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  departments: readonly string[];
  totalFetched: number;
  totalCount: number;
  isFetching: boolean;
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
  isDeleting: boolean;
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
  selectedCount,
  onClearSelection,
  onExportSelected,
  onDeleteSelected,
  isDeleting,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Workforce Directory</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <span className="font-mono tabular-nums">{totalFetched.toLocaleString()}</span>
            <span>of</span>
            <span className="font-mono tabular-nums">{totalCount.toLocaleString()}</span>
            <span>rows loaded</span>
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

      {selectedCount > 0 && (
        <div className="animate-slide-down flex items-center justify-between rounded-md border border-accent-soft-strong bg-accent-soft px-3 py-2">
          <span className="text-xs font-medium text-accent-hover">
            {selectedCount.toLocaleString()} row{selectedCount === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-md bg-danger px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete selected
            </button>
            <button
              type="button"
              onClick={onExportSelected}
              className="flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-accent-hover shadow-sm ring-1 ring-accent-soft-strong transition-colors hover:bg-accent-soft"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-accent-hover transition-colors hover:bg-accent-soft-strong"
            >
              <X className="size-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
