import { employees } from "@/data/employees";
import { leaveTypes } from "@/data/leaveTypes";
import { LeaveRequestActions } from "@/components/leave/LeaveRequestActions";
import type { LeaveRequest } from "@/types/leave";
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
import { CalendarOff } from "lucide-react";

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  onView: (request: LeaveRequest) => void;
  onApprove: (request: LeaveRequest) => void;
  onReject: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
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
  return duration === "half_day" ? "Half Day" : "Full Day";
};

const formatDateRange = (startDate: string, endDate: string) => {
  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} → ${endDate}`;
};

export function LeaveRequestTable({
  requests,
  onView,
  onApprove,
  onReject,
  onCancel,
}: LeaveRequestTableProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="No leave requests found"
        description="There are currently no leave requests matching your selected filter criteria."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">Employee</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Date Range</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="max-w-[200px]">Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {requests.map((request) => {
          const employee = employees.find(
            (item) => item.id === request.employeeId,
          );

          const leaveType = leaveTypes.find(
            (item) => item.id === request.leaveTypeId,
          );

          const initials = employee
            ? `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase()
            : "??";

          return (
            <TableRow key={request.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 select-none shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {employee
                        ? `${employee.firstName} ${employee.lastName}`
                        : "Unknown Employee"}
                    </p>
                    <p className="font-mono text-xs text-slate-400 truncate">
                      {employee?.employeeCode ?? request.employeeId}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="inline-flex items-center gap-1.5">
                  <span className="font-medium text-slate-800 text-xs">
                    {leaveType?.name ?? "General Leave"}
                  </span>
                  {leaveType?.code && (
                    <span className="font-mono text-[11px] text-slate-400">
                      ({leaveType.code})
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">
                {formatDateRange(request.startDate, request.endDate)}
              </TableCell>

              <TableCell className="text-xs text-slate-600">
                <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/60 px-2 py-0.5 font-medium text-slate-700">
                  {formatDuration(request.duration)}
                </span>
              </TableCell>

              <TableCell className="max-w-[200px]">
                <p className="truncate text-xs text-slate-600" title={request.reason}>
                  {request.reason}
                </p>
              </TableCell>

              <TableCell>
                <Badge variant={statusBadgeVariants[request.status]} dot>
                  {formatStatus(request.status)}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <LeaveRequestActions
                  request={request}
                  onView={() => onView(request)}
                  onApprove={() => onApprove(request)}
                  onReject={() => onReject(request)}
                  onCancel={() => onCancel(request)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
