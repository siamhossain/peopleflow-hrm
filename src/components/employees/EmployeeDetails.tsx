"use client";

import type { Department, Employee } from "@/types/employee";
import { Modal } from "@/components/ui/Modal";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  Calendar,
  Briefcase,
  Mail,
  Hash,
  Pencil,
} from "lucide-react";

interface EmployeeDetailsProps {
  employee: Employee;
  departments: Department[];
  onClose: () => void;
  onEdit: (employee: Employee) => void;
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

const formatDate = (date?: string) => {
  if (!date) return "—";

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

export function EmployeeDetails({
  employee,
  departments,
  onClose,
  onEdit,
  readOnly = false,
}: EmployeeDetailsProps) {
  const department = departments.find(
    (item) => item.id === employee.departmentId,
  );

  const initials = `${employee.firstName[0] || ""}${
    employee.lastName[0] || ""
  }`.toUpperCase();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Employee Profile"
      description="Detailed employee records and organizational assignment."
      size="lg"
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-base font-bold text-white shadow-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {employee.firstName} {employee.lastName}
              </h3>
              <Badge variant={statusBadgeVariants[employee.status]} dot>
                {formatStatus(employee.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {employee.designation} • {department?.name ?? "General"}
            </p>
          </div>
        </div>

        {/* Structured Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Employee Code */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Employee Code
              </p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                {employee.employeeCode}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Work Email
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                {employee.email}
              </p>
            </div>
          </div>

          {/* Designation */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Designation
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {employee.designation}
              </p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Department
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {department?.name ?? employee.departmentId}
                {department?.code && (
                  <span className="ml-1.5 text-xs text-slate-400 font-mono">
                    ({department.code})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Joining Date */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Joining Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(employee.joiningDate)}
              </p>
            </div>
          </div>

          {/* Resignation Date */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 bg-white shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Resignation Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(employee.resignationDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          {!readOnly ? (
            <Button
              type="button"
              variant="primary"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => onEdit(employee)}
            >
              Edit Employee
            </Button>
          ) : (
            <span />
          )}

          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
