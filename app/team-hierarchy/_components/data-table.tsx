"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { createManagerColumns } from "./columns";
import { Toolbar } from "./toolbar";
import { useDebouncedValue } from "@/lib/hooks";
import { DEPARTMENTS } from "@/lib/mock-data";
import type { HierarchyRow, ManagersResponse } from "@/types/manager";

const FETCH_SIZE = 100;

export function ManagerDataTable() {
  // ----- Selection & sorting -----
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // ----- Filters -----
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // ----- Columns (stable — no callbacks needed for this view) -----
  const columns = useMemo(() => createManagerColumns(), []);

  // ----- Data fetching -----
  const sortDescriptor = sorting[0] ?? null;
  const sortKey = sortDescriptor
    ? `${sortDescriptor.id}:${sortDescriptor.desc ? "desc" : "asc"}`
    : "none";

  const { data, fetchNextPage, isFetching, isLoading } = useInfiniteQuery<ManagersResponse>({
    queryKey: ["managers", debouncedSearch, department, sortKey],
    queryFn: async ({ pageParam }) => {
      const res = await fetch("/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: pageParam,
          limit: FETCH_SIZE,
          search: debouncedSearch,
          department,
          sortBy: sortDescriptor?.id ?? null,
          sortDirection: sortDescriptor ? (sortDescriptor.desc ? "desc" : "asc") : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch managers");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.nextOffset == null ? undefined : allPages.length + 1,
    placeholderData: (prev) => prev,
  });

  // Reset selection when filters/sort change
  useEffect(() => {
    setRowSelection({});
  }, [debouncedSearch, department, sortKey]);

  // ----- Derived data -----
  const flatData = useMemo(() => data?.pages?.flatMap((page) => page.rows) ?? [], [data]);
  const totalDBRowCount = data?.pages?.[0]?.filteredCount ?? 0;
  const totalRowCount = data?.pages?.[0]?.totalCount ?? 0;
  const totalFetched = flatData.length;

  const handleFetchMore = useCallback(() => fetchNextPage(), [fetchNextPage]);

  // TanStack Table's getSubRows callback — tells the table where children live
  const getSubRows = useCallback(
    (row: HierarchyRow) => (row as any).subRows as HierarchyRow[] | undefined,
    []
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <Toolbar
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        departments={DEPARTMENTS}
        totalFetched={totalFetched}
        totalCount={department || search ? totalDBRowCount : totalRowCount}
        isFetching={isFetching}
      />

      <DataTable
        data={flatData}
        columns={columns}
        getRowId={(row) => row.id}
        totalRowCount={totalDBRowCount}
        isFetching={isFetching}
        isLoading={isLoading}
        onFetchMore={handleFetchMore}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        sorting={sorting}
        onSortingChange={setSorting}
        enableExpanding
        getSubRows={getSubRows}
        defaultColumnPinning={{ left: ["select", "contactName"] }}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-ink">No matching managers</p>
            <p className="text-xs text-ink-faint">
              Try adjusting your search or department filter.
            </p>
          </div>
        }
        loadingState={
          <div className="flex h-64 items-center justify-center text-sm text-ink-faint">
            Loading team hierarchy…
          </div>
        }
      />
    </div>
  );
}
