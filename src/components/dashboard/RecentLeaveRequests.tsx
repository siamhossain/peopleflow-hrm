import { CalendarDays, Clock, FileText, User } from "lucide-react";

import type { LeaveRequest } from "@/types/leave";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface RecentLeaveRequestsProps {
  requests: LeaveRequest[];
}

const statusVariants: Record<LeaveRequest["status"], BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
};

export function RecentLeaveRequests({ requests }: RecentLeaveRequestsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Leave Requests</CardTitle>
            <CardDescription className="mt-1">
              Latest employee leave activity submitted to HR.
            </CardDescription>
          </div>

          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {requests.length} Recent
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Recent Leave Requests"
            description="There are currently no recent leave requests recorded in the system."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/60 sm:px-6"
              >
                <div className="flex items-start gap-3.5">
                  {/* Employee Avatar Badge */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 shadow-2xs">
                    <User className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900">
                        {request.employeeId}
                      </p>

                      <span className="text-slate-300">·</span>

                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {request.duration === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {request.reason}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {formatDate(request.startDate)} → {formatDate(request.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between items-center gap-1 shrink-0 pl-13 sm:pl-0">
                  <Badge
                    variant={statusVariants[request.status] ?? "neutral"}
                    dot
                  >
                    {request.status}
                  </Badge>

                  {request.createdAt && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(request.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
