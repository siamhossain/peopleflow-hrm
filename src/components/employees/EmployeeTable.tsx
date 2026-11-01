import type { Employee } from "@/types/employee";
import { Eye, Pencil, UserX } from "lucide-react";

interface EmployeeTableProps {
  employees: Employee[];
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
}

const statusStyles: Record<Employee["status"], string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  on_leave: "bg-amber-50 text-amber-700",
  resigned: "bg-red-50 text-red-700",
};

const formatStatus = (status: Employee["status"]) => {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDeactivate,
}: EmployeeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-600">Employee</th>
              <th className="px-5 py-3 font-medium text-gray-600">
                Employee Code
              </th>
              <th className="px-5 py-3 font-medium text-gray-600">
                Designation
              </th>
              <th className="px-5 py-3 font-medium text-gray-600">
                Department
              </th>
              <th className="px-5 py-3 font-medium text-gray-600">
                Joining Date
              </th>
              <th className="px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    No employees found
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{employee.email}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {employee.employeeCode}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {employee.designation}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {employee.departmentId}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                    {formatDate(employee.joiningDate)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusStyles[employee.status]
                      }`}
                    >
                      {formatStatus(employee.status)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => onView(employee)}
                        title="View employee"
                        aria-label={`View ${employee.firstName} ${employee.lastName}`}
                        className="rounded-md p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(employee)}
                        title="Edit employee"
                        aria-label={`Edit ${employee.firstName} ${employee.lastName}`}
                        className="rounded-md p-2 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Deactivate */}
                      {(employee.status === "active" ||
                        employee.status === "on_leave") && (
                        <button
                          type="button"
                          onClick={() => onDeactivate(employee)}
                          title="Deactivate employee"
                          aria-label={`Deactivate ${employee.firstName} ${employee.lastName}`}
                          className="rounded-md p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
