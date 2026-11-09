"use client";

import { employees } from "@/data/employees";
import { leaveTypes } from "@/data/leaveTypes";
import type { LeaveRequest } from "@/types/leave";
import { Modal } from "@/components/ui/Modal";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Tag,
} from "lucide-react";

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
  onClose: () => void;
}

const statusBadgeVariants: Record<LeaveRequest["status"], BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const formatStatus = (status: LeaveRequest["status"]) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDuration = (duration: LeaveRequest["duration"]) => {
  return duration === "half_day" ? "Half Day (0.5)" : "Full Day (1.0)";
};

const formatDate = (date: string) => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
};

const formatDateTime = (date?: string) => {
  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return date;
  }
};

export function LeaveRequestDetails({
  request,
  onClose,
}: LeaveRequestDetailsProps) {
  const employee = employees.find((item) => item.id === request.employeeId);
  const leaveType = leaveTypes.find((item) => item.id === request.leaveTypeId);
  const reviewer = request.reviewedBy
    ? employees.find((item) => item.id === request.reviewedBy)
    : undefined;

  const employeeInitials = employee
    ? `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase()
    : "??";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Leave Application Details"
      description="Detailed application breakdown, dates, and administrative audit record."
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Preview */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-xs">
            {employeeInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {employee
                  ? `${employee.firstName} ${employee.lastName}`
                  : "Unknown Employee"}
              </h3>
              <Badge variant={statusBadgeVariants[request.status]} dot>
                {formatStatus(request.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {employee?.designation ?? "Staff Member"} • Code:{" "}
              <span className="font-mono">{employee?.employeeCode ?? request.employeeId}</span>
            </p>
          </div>
        </div>

        {/* Structured Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2">
          {/* Leave Type */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Leave Category
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {leaveType?.name ?? "Standard Leave"}
              </p>
              {leaveType?.code && (
                <p className="text-xs font-mono text-slate-400">
                  Code: {leaveType.code}
                </p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Duration Type
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDuration(request.duration)}
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Start Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(request.startDate)}
              </p>
            </div>
          </div>

          {/* End Date */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                End Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatDate(request.endDate)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-500 mb-1.5">
              <FileText className="h-4 w-4" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Applicant Statement / Reason
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 bg-slate-50/60 rounded-lg p-3 border border-slate-100">
              {request.reason}
            </p>
          </div>

          {/* Submitted At */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Submitted On
            </p>
            <p className="mt-0.5 text-xs text-slate-700">
              {formatDateTime(request.createdAt)}
            </p>
          </div>

          {/* Review Details */}
          <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Review Status
              </p>
            </div>
            <p className="mt-0.5 text-xs font-medium text-slate-900">
              {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Pending Review"}
            </p>
            {request.reviewedAt && (
              <p className="text-[11px] text-slate-400">
                On: {formatDateTime(request.reviewedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
