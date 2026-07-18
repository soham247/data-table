import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import type { EmployeeStatus } from "@/types/employee";

dotenv.config({ path: ".env.local" });
dotenv.config();

const TOTAL_MANAGERS = 1_000;
const BATCH_SIZE = 500;

const DEPARTMENTS = [
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

const MANAGER_TITLES_BY_DEPT: Record<string, string[]> = {
  Engineering: ["Engineering Manager", "Staff Engineer", "Principal Engineer", "VP of Engineering"],
  Sales: ["Sales Manager", "VP of Sales", "Regional Sales Director", "Head of Sales"],
  Marketing: ["Marketing Manager", "VP of Marketing", "Head of Growth", "Brand Director"],
  Finance: ["Finance Manager", "VP of Finance", "Controller", "CFO"],
  "Human Resources": ["HR Manager", "Head of People", "VP of HR", "Chief People Officer"],
  Operations: ["Operations Manager", "VP of Operations", "Director of Ops", "COO"],
  Legal: ["General Counsel", "Head of Legal", "VP of Compliance", "Legal Director"],
  "Customer Support": ["Support Team Lead", "Head of Support", "VP of Customer Success"],
  Product: ["Product Manager", "Senior PM", "Director of Product", "VP of Product"],
  Design: ["Design Lead", "Head of Design", "VP of Design", "Design Director"],
};

const REPORT_TITLES_BY_DEPT: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Engineer", "DevOps Engineer", "QA Engineer", "Frontend Developer"],
  Sales: ["Account Executive", "Sales Development Rep", "Inside Sales Rep", "Enterprise AE"],
  Marketing: ["Marketing Specialist", "Content Strategist", "SEO Analyst", "Growth Marketer"],
  Finance: ["Financial Analyst", "Accountant", "Billing Specialist", "Tax Analyst"],
  "Human Resources": ["HR Generalist", "Recruiter", "HR Coordinator", "Benefits Specialist"],
  Operations: ["Operations Analyst", "Supply Chain Lead", "Logistics Coordinator", "Process Engineer"],
  Legal: ["Legal Counsel", "Paralegal", "Compliance Officer", "Contract Specialist"],
  "Customer Support": ["Support Specialist", "Technical Support", "Customer Success Manager", "Support Engineer"],
  Product: ["Associate PM", "Product Analyst", "Product Designer", "UX Researcher"],
  Design: ["UI Designer", "UX Researcher", "Visual Designer", "Interaction Designer"],
};

const STATUSES: EmployeeStatus[] = ["Active", "Active", "Active", "Active", "On Leave", "Inactive", "Terminated"];

const SKILL_POOL = [
  "React", "TypeScript", "Node.js", "Python", "SQL", "AWS", "Docker", "Kubernetes",
  "Figma", "Salesforce", "Excel", "SEO", "Public Speaking", "Negotiation", "Go",
  "Java", "Terraform", "GraphQL", "Data Analysis", "Project Management",
];

interface PersonSeed {
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

function buildPerson(department: string, titles: string[]): PersonSeed {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    department,
    jobTitle: faker.helpers.arrayElement(titles),
    status: faker.helpers.arrayElement(STATUSES),
    location: faker.location.city(),
    country: faker.location.country(),
    salary: faker.number.int({ min: 45_000, max: 320_000 }),
    currency: "USD",
    joinDate: faker.date.between({ from: "2015-01-01", to: "2026-06-01" }).toISOString(),
    yearsOfExperience: faker.number.int({ min: 3, max: 25 }),
    performanceScore: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    projectsCompleted: faker.number.int({ min: 5, max: 120 }),
    lastLoginAt: faker.date.recent({ days: 45 }).toISOString(),
    skills: faker.helpers.arrayElements(SKILL_POOL, { min: 2, max: 5 }).join(", "),
  };
}

interface DirectReportSeed extends PersonSeed {
  reportId: string;
}

interface ManagerSeed extends PersonSeed {
  managerId: string;
  directReports: DirectReportSeed[];
}

function buildManager(index: number): ManagerSeed {
  // Deterministic seed per manager for reproducibility
  faker.seed(index + 100_000);

  const department = faker.helpers.arrayElement(DEPARTMENTS);
  const managerTitles = MANAGER_TITLES_BY_DEPT[department];
  const reportTitles = REPORT_TITLES_BY_DEPT[department];

  const manager: ManagerSeed = {
    ...buildPerson(department, managerTitles),
    managerId: `MGR-${String(index + 1).padStart(6, "0")}`,
    directReports: [],
  };

  // Distribution: ~33% get 0 reports, ~34% get 1, ~33% get 2
  const reportCount = index % 3 === 0 ? 0 : index % 3 === 1 ? 1 : 2;

  for (let r = 0; r < reportCount; r++) {
    // Sub-seed so reports are also deterministic
    faker.seed(index * 1000 + r + 200_000);
    const globalReportIndex = index * 2 + r;
    manager.directReports.push({
      ...buildPerson(department, reportTitles),
      reportId: `RPT-${String(globalReportIndex + 1).padStart(6, "0")}`,
      // Reports inherit same department as their manager
    });
  }

  return manager;
}

async function main() {
  const { getDb } = await import("@/lib/mongodb");

  const db = await getDb();
  const collection = db.collection("managers");

  // Clear existing data
  await collection.deleteMany({});

  let totalReports = 0;

  for (let batchStart = 0; batchStart < TOTAL_MANAGERS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_MANAGERS);
    const batch: ManagerSeed[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      const manager = buildManager(i);
      totalReports += manager.directReports.length;
      batch.push(manager);
    }

    await collection.insertMany(batch, { ordered: true });
    console.log(`Inserted ${batchEnd.toLocaleString()} / ${TOTAL_MANAGERS.toLocaleString()} managers`);
  }

  // Create indexes
  await collection.createIndexes([
    { key: { managerId: 1 }, name: "managerId_1" },
    { key: { department: 1 }, name: "department_1" },
    { key: { managerId: 1, department: 1 }, name: "managerId_1_department_1" },
  ]);

  console.log(
    `\nSeed complete: ${TOTAL_MANAGERS.toLocaleString()} managers with ${totalReports.toLocaleString()} total direct reports.`
  );
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
