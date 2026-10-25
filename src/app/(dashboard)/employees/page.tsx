import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { getEmployees } from "@/services/employeeService";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <section>
      <div>
        <p className="text-sm font-medium text-gray-500">Employee Management</p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">Employees</h1>

        <p className="mt-2 text-sm text-gray-600">
          View and manage employee information.
        </p>
      </div>

      <div className="mt-6">
        <EmployeeFilters initialEmployees={employees} />
      </div>
    </section>
  );
}
