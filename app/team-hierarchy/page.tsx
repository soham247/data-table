import { ManagerDataTable } from "./_components/data-table";

export default function TeamHierarchyPage() {
  return (
    <main className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="min-h-0 flex-1">
        <ManagerDataTable />
      </div>
    </main>
  );
}

