"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { createColumns } from "./columns";
import { Toolbar } from "./toolbar";
import { useDebouncedValue } from "@/lib/hooks";
import { exportRowsToCsv } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/mock-data";
import type { EmployeesResponse } from "@/types/employee";

const FETCH_SIZE = 100;

export function EmployeeDataTable() {
  const queryClient = useQueryClient();

  // ----- Selection & sorting (controlled by us, passed to DataTable) -----
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // ----- Filters (employee-specific) -----
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // ----- Delete mutation -----
  const deleteEmployeesMutation = useMutation({
    mutationFn: async (employeeIds: string[]) => {
      const res = await fetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: employeeIds }),
      });

      if (!res.ok) {
        const message = await res.text().catch(() => "Failed to delete employees");
        throw new Error(message || "Failed to delete employees");
      }

      return res.json() as Promise<{ deletedCount: number }>;
    },
    onSuccess: async () => {
      setRowSelection({});
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const { isPending: isDeleting, mutate: mutateDelete } = deleteEmployeesMutation;

  const handleDeleteEmployees = useCallback(
    (employeeIds: string[]) => {
      if (!employeeIds.length || isDeleting) return;
      const confirmed =
        employeeIds.length === 1
          ? window.confirm("Delete this employee?")
          : window.confirm(`Delete ${employeeIds.length} selected employees?`);

      if (!confirmed) return;
      mutateDelete(employeeIds);
    },
    [isDeleting, mutateDelete]
  );

  // ----- Columns -----
  const columns = useMemo(
    () =>
      createColumns({
        onDeleteEmployees: handleDeleteEmployees,
        isDeleting,
      }),
    [isDeleting, handleDeleteEmployees]
  );

  // ----- Data fetching -----
  const sortDescriptor = sorting[0] ?? null;
  const sortKey = sortDescriptor
    ? `${sortDescriptor.id}:${sortDescriptor.desc ? "desc" : "asc"}`
    : "none";

  const { data, fetchNextPage, isFetching, isLoading } = useInfiniteQuery<EmployeesResponse>({
    queryKey: ["employees", debouncedSearch, department, sortKey],
    queryFn: async ({ pageParam }) => {
      const res = await fetch("/api/employees", {
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
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.nextOffset == null ? undefined : allPages.length + 1,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    setRowSelection({});
  }, [debouncedSearch, department, sortKey]);

  // ----- Derived data -----
  const flatData = useMemo(() => data?.pages?.flatMap((page) => page.rows) ?? [], [data]);
  const totalDBRowCount = data?.pages?.[0]?.filteredCount ?? 0;
  const totalRowCount = data?.pages?.[0]?.totalCount ?? 0;
  const totalFetched = flatData.length;

  const selectedRowIds = useMemo(
    () => flatData.filter((row) => rowSelection[row.id] === true).map((row) => row.id),
    [flatData, rowSelection]
  );

  const handleExportSelected = useCallback(() => {
    const selectedRows = flatData.filter((row) => rowSelection[row.id] === true);
    exportRowsToCsv(
      selectedRows.map((r) => r as unknown as Record<string, unknown>),
      "selected-employees.csv"
    );
  }, [flatData, rowSelection]);

  const handleBulkDelete = useCallback(() => {
    handleDeleteEmployees(selectedRowIds);
  }, [handleDeleteEmployees, selectedRowIds]);

  const handleFetchMore = useCallback(() => fetchNextPage(), [fetchNextPage]);

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
        selectedCount={selectedRowIds.length}
        onClearSelection={() => setRowSelection({})}
        onExportSelected={handleExportSelected}
        onDeleteSelected={handleBulkDelete}
        isDeleting={isDeleting}
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
        defaultColumnPinning={{ left: ["select", "contactName"], right: ["actions"] }}
        pinnedRightGuard="actions"
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-ink">No matching employees</p>
            <p className="text-xs text-ink-faint">
              Try adjusting your search or department filter.
            </p>
          </div>
        }
        loadingState={
          <div className="flex h-64 items-center justify-center text-sm text-ink-faint">
            Loading employees…
          </div>
        }
      />
    </div>
  );
}
