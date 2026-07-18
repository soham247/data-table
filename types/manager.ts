export type EmployeeStatus = "Active" | "Inactive" | "On Leave" | "Terminated";

/**
 * Shared person fields used by both managers and their direct reports.
 * Keeping them identical means a single set of column definitions can
 * render rows at any nesting depth.
 */
interface PersonFields {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  status: EmployeeStatus;
  location: string;
  country: string;
  salary: number;
  currency: string;
  joinDate: string;
  yearsOfExperience: number;
  performanceScore: number;
  projectsCompleted: number;
  lastLoginAt: string;
  skills: string;
}

export interface DirectReport extends PersonFields {
  reportId: string;
}

export interface Manager extends PersonFields {
  managerId: string;
  /** TanStack Table's default key for nested child rows. */
  subRows?: DirectReport[];
}

/** Union type — a row at any depth shares PersonFields. */
export type HierarchyRow = Manager | DirectReport;

export interface ManagersResponse {
  rows: Manager[];
  nextOffset: number | null;
  totalCount: number;
  filteredCount: number;
}
