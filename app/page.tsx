import { EmployeeDataTable } from "./_components/data-table";

export default function Home() {
  return (
    <main className="flex h-screen flex-col gap-4 p-4 sm:p-6">
      <header className="shrink-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
          Enterprise Data Grid Demo
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <EmployeeDataTable />
      </div>
    </main>
  );
}
