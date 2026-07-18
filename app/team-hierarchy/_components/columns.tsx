import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import type { HierarchyRow, Manager } from "@/types/manager";
import type { EmployeeStatus } from "@/types/employee";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { IndeterminateCheckbox } from "@/components/data-table";

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  Active: "bg-success-soft text-success",
  "On Leave": "bg-warning-soft text-warning",
  Inactive: "bg-neutral-soft text-ink-muted",
  Terminated: "bg-danger-soft text-danger",
};

function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function PerformanceBadge({ score }: { score: number }) {
  const tone =
    score >= 4 ? "text-success" : score >= 2.5 ? "text-warning" : "text-danger";
  return (
    <span className={`font-mono text-xs font-semibold tabular-nums ${tone}`}>
      {score.toFixed(1)}
    </span>
  );
}

/**
 * Columns for the team hierarchy table.
 *
 * The data type is `HierarchyRow` (union of Manager | DirectReport).
 * TanStack Table treats `subRows` on Manager as children, so both
 * depth-0 (manager) and depth-1 (report) rows render through these
 * same column definitions.
 */
export function createManagerColumns(): ColumnDef<HierarchyRow>[] {
  return [
    // --- Select ---
    {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 44,
      minSize: 44,
      maxSize: 44,
      enableResizing: false,
      enableSorting: false,
      enableHiding: false,
      enablePinning: false,
    },

    // --- Contact Name (with expand/collapse chevron) ---
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "contactName",
      header: "Contact Name",
      size: 260,
      minSize: 180,
      cell: ({ row, getValue }) => {
        const canExpand = row.getCanExpand();
        const depth = row.depth;

        return (
          <div
            className="flex items-center gap-1.5"
            style={{ paddingLeft: `${depth * 24}px` }}
          >
            {canExpand ? (
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className="flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-border"
                aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
              >
                <ChevronRight
                  className={`size-3.5 text-ink-muted transition-transform duration-150 ${
                    row.getIsExpanded() ? "rotate-90" : ""
                  }`}
                />
              </button>
            ) : (
              // Spacer so child rows align with parent text
              <span className="inline-block size-5 shrink-0" />
            )}
            <span className={`truncate font-medium ${depth === 0 ? "text-ink" : "text-ink-muted"}`}>
              {getValue<string>()}
            </span>
          </div>
        );
      },
    },

    // --- ID (Manager ID or Report ID depending on depth) ---
    {
      id: "hierarchyId",
      header: "ID",
      size: 130,
      minSize: 90,
      accessorFn: (row) => {
        if ("managerId" in row) return row.managerId;
        if ("reportId" in row) return row.reportId;
        return "";
      },
      cell: (info) => (
        <span className="font-mono text-xs text-ink-muted">{info.getValue<string>()}</span>
      ),
    },

    // --- Email ---
    {
      accessorKey: "email",
      header: "Email",
      size: 250,
      minSize: 140,
      cell: (info) => <span className="text-ink-muted">{info.getValue<string>()}</span>,
    },

    // --- Phone ---
    {
      accessorKey: "phone",
      header: "Phone",
      size: 170,
      minSize: 120,
      cell: (info) => (
        <span className="font-mono text-xs text-ink-muted">{info.getValue<string>()}</span>
      ),
    },

    // --- Department ---
    {
      accessorKey: "department",
      header: "Department",
      size: 170,
      minSize: 100,
    },

    // --- Job Title ---
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      size: 200,
      minSize: 120,
    },

    // --- Status ---
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      minSize: 100,
      cell: (info) => <StatusBadge status={info.getValue<EmployeeStatus>()} />,
    },

    // --- Direct Reports count (manager only) ---
    {
      id: "reportCount",
      header: "Reports",
      size: 90,
      minSize: 70,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.depth > 0) return null;
        const manager = row.original as Manager;
        const count = manager.subRows?.length ?? 0;
        return (
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {count}
          </span>
        );
      },
    },

    // --- Location ---
    {
      accessorKey: "location",
      header: "Location",
      size: 150,
      minSize: 100,
    },

    // --- Country ---
    {
      accessorKey: "country",
      header: "Country",
      size: 150,
      minSize: 100,
    },

    // --- Salary ---
    {
      accessorKey: "salary",
      header: "Salary",
      size: 120,
      minSize: 90,
      cell: (info) => (
        <span className="font-mono text-xs tabular-nums">
          {formatCurrency(info.getValue<number>(), info.row.original.currency)}
        </span>
      ),
    },

    // --- Experience ---
    {
      accessorKey: "yearsOfExperience",
      header: "Exp (yrs)",
      size: 100,
      minSize: 80,
      cell: (info) => (
        <span className="font-mono text-xs tabular-nums">{info.getValue<number>()}</span>
      ),
    },

    // --- Performance Score ---
    {
      accessorKey: "performanceScore",
      header: "Perf. Score",
      size: 110,
      minSize: 90,
      cell: (info) => <PerformanceBadge score={info.getValue<number>()} />,
    },

    // --- Projects Completed ---
    {
      accessorKey: "projectsCompleted",
      header: "Projects",
      size: 100,
      minSize: 80,
      cell: (info) => (
        <span className="font-mono text-xs tabular-nums">{info.getValue<number>()}</span>
      ),
    },

    // --- Join Date ---
    {
      accessorKey: "joinDate",
      header: "Join Date",
      size: 120,
      minSize: 100,
      cell: (info) => (
        <span className="text-xs text-ink-muted">{formatDate(info.getValue<string>())}</span>
      ),
    },

    // --- Last Login ---
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      size: 170,
      minSize: 120,
      cell: (info) => (
        <span className="text-xs text-ink-muted">{formatDateTime(info.getValue<string>())}</span>
      ),
    },

    // --- Skills ---
    {
      accessorKey: "skills",
      header: "Skills",
      size: 280,
      minSize: 140,
      cell: (info) => (
        <span className="block truncate text-ink-muted" title={info.getValue<string>()}>
          {info.getValue<string>()}
        </span>
      ),
    },
  ];
}
