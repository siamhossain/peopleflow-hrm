import type { Department, Employee } from "@/types/employee";
import { Eye, Pencil, UserX, Users } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

interface EmployeeTableProps {
  employees: Employee[];
  departments: Department[];
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  readOnly?: boolean;
}

const statusBadgeVariants: Record<Employee["status"], BadgeVariant> = {
  active: "success",
  inactive: "neutral",
  on_leave: "warning",
  resigned: "danger",
};

const formatStatus = (status: Employee["status"]) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (date: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
};

export function EmployeeTable({
  employees,
  departments,
  onView,
  onEdit,
  onDeactivate,
  readOnly = false,
}: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs">
        <EmptyState
          icon={Users}
          title="No employees found"
          description="We couldn't find any employee records matching your current search or filters."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Employee</TableHead>
            <TableHead>Employee Code</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Joining Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {employees.map((employee) => {
            const initials = `${employee.firstName[0] || ""}${
              employee.lastName[0] || ""
            }`.toUpperCase();

            const departmentName =
              departments.find(
                (department) => department.id === employee.departmentId,
              )?.name ?? "—";

            return (
              <TableRow key={employee.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100/80 text-xs font-semibold text-indigo-700 select-none shadow-2xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{employee.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs font-medium text-slate-600">
                  {employee.employeeCode}
                </TableCell>

                <TableCell className="font-medium text-slate-700">
                  {employee.designation}
                </TableCell>

                <TableCell className="text-slate-600">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {departmentName}
                  </span>
                </TableCell>

                <TableCell className="whitespace-nowrap text-xs text-slate-600">
                  {formatDate(employee.joiningDate)}
                </TableCell>

                <TableCell>
                  <Badge variant={statusBadgeVariants[employee.status]} dot>
                    {formatStatus(employee.status)}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(employee)}
                      title="View details"
                      aria-label={`View ${employee.firstName} ${employee.lastName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(employee)}
                          title="Edit employee"
                          aria-label={`Edit ${employee.firstName} ${employee.lastName}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {(employee.status === "active" ||
                          employee.status === "on_leave") && (
                          <button
                            type="button"
                            onClick={() => onDeactivate(employee)}
                            title="Deactivate employee"
                            aria-label={`Deactivate ${employee.firstName} ${employee.lastName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
