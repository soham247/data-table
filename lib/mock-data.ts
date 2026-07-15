import { faker } from "@faker-js/faker";
import type { Employee, EmployeeStatus } from "@/types/employee";

// Total size of the mock enterprise dataset. Bump this up to simulate
// even larger datasets -- the API/pagination/virtualization approach
// does not change regardless of size.
export const TOTAL_ROWS = 100_000;

export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "Legal",
  "Customer Support",
  "Product",
  "Design",
] as const;

const JOB_TITLES_BY_DEPT: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager", "DevOps Engineer", "QA Engineer"],
  Sales: ["Account Executive", "Sales Development Rep", "Sales Manager", "VP of Sales", "Regional Sales Director"],
  Marketing: ["Marketing Specialist", "Content Strategist", "SEO Analyst", "Marketing Manager", "Brand Manager"],
  Finance: ["Financial Analyst", "Accountant", "Controller", "Finance Manager", "VP of Finance"],
  "Human Resources": ["HR Generalist", "Recruiter", "HR Business Partner", "HR Manager", "Head of People"],
  Operations: ["Operations Analyst", "Operations Manager", "Supply Chain Lead", "Business Operations Director"],
  Legal: ["Legal Counsel", "Paralegal", "Compliance Officer", "General Counsel"],
  "Customer Support": ["Support Specialist", "Support Team Lead", "Customer Success Manager", "Head of Support"],
  Product: ["Product Manager", "Senior PM", "Product Designer", "Director of Product"],
  Design: ["UI Designer", "UX Researcher", "Design Lead", "Head of Design"],
};

const STATUSES: EmployeeStatus[] = ["Active", "Active", "Active", "Active", "On Leave", "Inactive", "Terminated"];

const SKILL_POOL = [
  "React", "TypeScript", "Node.js", "Python", "SQL", "AWS", "Docker", "Kubernetes",
  "Figma", "Salesforce", "Excel", "SEO", "Public Speaking", "Negotiation", "Go",
  "Java", "Terraform", "GraphQL", "Data Analysis", "Project Management",
];

function seededEmployee(index: number): Employee {
  // Deterministic per-row seed so the dataset is stable across requests
  // and server restarts, without needing to persist anything to disk.
  faker.seed(index + 1);

  const department = faker.helpers.arrayElement(DEPARTMENTS);
  const titles = JOB_TITLES_BY_DEPT[department];
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const joinDate = faker.date.between({ from: "2015-01-01", to: "2026-06-01" });
  const lastLoginAt = faker.date.recent({ days: 45 });
  const yearsOfExperience = faker.number.int({ min: 0, max: 25 });

  return {
    id: String(index + 1),
    employeeId: `EMP-${String(index + 1).padStart(6, "0")}`,
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    department,
    jobTitle: faker.helpers.arrayElement(titles),
    status: faker.helpers.arrayElement(STATUSES),
    location: faker.location.city(),
    country: faker.location.country(),
    manager: `${faker.person.firstName()} ${faker.person.lastName()}`,
    salary: faker.number.int({ min: 45_000, max: 320_000 }),
    currency: "USD",
    joinDate: joinDate.toISOString(),
    yearsOfExperience,
    performanceScore: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    projectsCompleted: faker.number.int({ min: 0, max: 120 }),
    lastLoginAt: lastLoginAt.toISOString(),
    skills: faker.helpers.arrayElements(SKILL_POOL, { min: 2, max: 5 }).join(", "),
  };
}

// Cache the generated dataset on the global object so it survives
// Next.js dev-server hot reloads and isn't regenerated on every request.
declare global {
  // eslint-disable-next-line no-var
  var __EMPLOYEE_CACHE__: Employee[] | undefined;
}

export function getAllEmployees(): Employee[] {
  if (!globalThis.__EMPLOYEE_CACHE__) {
    const rows = new Array(TOTAL_ROWS);
    for (let i = 0; i < TOTAL_ROWS; i++) {
      rows[i] = seededEmployee(i);
    }
    globalThis.__EMPLOYEE_CACHE__ = rows;
  }
  return globalThis.__EMPLOYEE_CACHE__;
}
