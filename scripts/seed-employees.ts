import dotenv from "dotenv";
import type { Employee } from "@/types/employee";

type EmployeeSeedDocument = Omit<Employee, "id">;

const BATCH_SIZE = 1000;

dotenv.config({ path: ".env.local" });
dotenv.config();

function toSeedDocument(employee: Employee): EmployeeSeedDocument {
  const { id: _id, ...document } = employee;
  return document;
}

async function main() {
  const [{ getDb }, { getAllEmployees }] = await Promise.all([
    import("@/lib/mongodb"),
    import("@/lib/mock-data"),
  ]);

  const db = await getDb();
  const collection = db.collection<EmployeeSeedDocument>("employees");
  const employees = getAllEmployees().map(toSeedDocument);

  await collection.deleteMany({});

  for (let index = 0; index < employees.length; index += BATCH_SIZE) {
    const batch = employees.slice(index, index + BATCH_SIZE);
    await collection.insertMany(batch, { ordered: true });
    const inserted = Math.min(index + batch.length, employees.length);
    console.log(`Inserted ${inserted.toLocaleString()} / ${employees.length.toLocaleString()}`);
  }

  await collection.createIndexes([
    { key: { employeeId: 1 }, name: "employeeId_1" },
    { key: { department: 1 }, name: "department_1" },
    { key: { employeeId: 1, department: 1 }, name: "employeeId_1_department_1" },
  ]);

  console.log(`Seed complete: ${employees.length.toLocaleString()} employees migrated.`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
