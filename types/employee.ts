export type EmployeeStatus = "Active" | "Inactive" | "On Leave" | "Terminated";

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  status: EmployeeStatus;
  location: string;
  country: string;
  manager: string;
  salary: number;
  currency: string;
  joinDate: string;
  yearsOfExperience: number;
  performanceScore: number;
  projectsCompleted: number;
  lastLoginAt: string;
  skills: string;
}

export interface EmployeesResponse {
  rows: Employee[];
  nextOffset: number | null;
  totalCount: number;
  filteredCount: number;
}
