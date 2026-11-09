import { auth } from "../../../../auth";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { getEmployees } from "@/services/employeeService";

export default async function EmployeesPage() {
  const session = await auth();

  const isDemoViewer = session?.user?.role === "DEMO_VIEWER";

  const employees = await getEmployees();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Workforce Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Employees
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, filter, and manage employee records, department assignments, and employment status.
          </p>
        </div>
      </div>

      <EmployeeFilters
        initialEmployees={employees}
        isDemoViewer={isDemoViewer}
      />
    </div>
  );
}
