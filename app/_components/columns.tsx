import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { Employee, EmployeeStatus } from "@/types/employee";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { IndeterminateCheckbox } from "@/components/data-table";

interface CreateColumnsOptions {
  onDeleteEmployees: (employeeIds: string[]) => void;
  isDeleting: boolean;
}

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

export function createColumns({ onDeleteEmployees, isDeleting }: CreateColumnsOptions): ColumnDef<Employee>[] {
  return [
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
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "contactName",
      header: "Contact Name",
      size: 200,
      minSize: 160,
      cell: (info) => <span className="font-medium text-ink">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "employeeId",
      header: "Employee ID",
      size: 130,
      minSize: 90,
      cell: (info) => (
        <span className="font-mono text-xs text-ink-muted">{info.getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 250,
      minSize: 140,
      cell: (info) => <span className="text-ink-muted">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      size: 170,
      minSize: 120,
      cell: (info) => (
        <span className="font-mono text-xs text-ink-muted">{info.getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      size: 170,
      minSize: 100,
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      size: 200,
      minSize: 120,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      minSize: 100,
      cell: (info) => <StatusBadge status={info.getValue<EmployeeStatus>()} />,
    },
    {
      accessorKey: "location",
      header: "Location",
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: "country",
      header: "Country",
      size: 150,
      minSize: 100,
    },
    {
      accessorKey: "manager",
      header: "Manager",
      size: 170,
      minSize: 100,
    },
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
    {
      accessorKey: "yearsOfExperience",
      header: "Exp (yrs)",
      size: 100,
      minSize: 80,
      cell: (info) => (
        <span className="font-mono text-xs tabular-nums">{info.getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "performanceScore",
      header: "Perf. Score",
      size: 110,
      minSize: 90,
      cell: (info) => <PerformanceBadge score={info.getValue<number>()} />,
    },
    {
      accessorKey: "projectsCompleted",
      header: "Projects",
      size: 100,
      minSize: 80,
      cell: (info) => (
        <span className="font-mono text-xs tabular-nums">{info.getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      size: 120,
      minSize: 100,
      cell: (info) => (
        <span className="text-xs text-ink-muted">{formatDate(info.getValue<string>())}</span>
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      size: 170,
      minSize: 120,
      cell: (info) => (
        <span className="text-xs text-ink-muted">{formatDateTime(info.getValue<string>())}</span>
      ),
    },
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
    {
      id: "actions",
      header: "Actions",
      size: 92,
      minSize: 92,
      maxSize: 92,
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
      enableResizing: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onDeleteEmployees([row.original.id])}
          disabled={isDeleting}
          className="inline-flex size-8 items-center justify-center rounded-md text-danger outline-none transition-colors hover:bg-danger-soft hover:text-danger-hover disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Delete ${row.original.firstName} ${row.original.lastName}`}
          title="Delete row"
        >
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ];
}
