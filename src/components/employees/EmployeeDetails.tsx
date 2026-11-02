"use client";

import type { Department, Employee } from "@/types/employee";

interface EmployeeDetailsProps {
  employee: Employee;
  departments: Department[];
  onClose: () => void;
  onEdit: (employee: Employee) => void;
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

const formatDate = (date?: string) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

export function EmployeeDetails({
  employee,
  departments,
  onClose,
  onEdit,
}: EmployeeDetailsProps) {
  const department = departments.find(
    (item) => item.id === employee.departmentId,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Employee Details
            </p>

            <h2
              id="employee-details-title"
              className="mt-1 text-xl font-semibold text-gray-900"
            >
              {employee.firstName} {employee.lastName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close employee details"
            className="rounded-lg p-2 text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            ×
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Employee Code
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {employee.employeeCode}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </p>

            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                statusStyles[employee.status]
              }`}
            >
              {formatStatus(employee.status)}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Email
            </p>
            <p className="mt-1 text-sm text-gray-900">{employee.email}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Designation
            </p>
            <p className="mt-1 text-sm text-gray-900">{employee.designation}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Department
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {department?.name ?? employee.departmentId}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Department Code
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {department?.code ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Joining Date
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(employee.joiningDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Resignation Date
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {formatDate(employee.resignationDate)}
            </p>
          </div>
        </div>

        <div className="flex justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={() => onEdit(employee)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Edit Employee
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
