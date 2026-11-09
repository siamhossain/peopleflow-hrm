"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Clock, FileText, X } from "lucide-react";

import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import type { LeaveRequest } from "@/types/leave";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

interface MyLeaveClientProps {
  employeeId: string;
  canRequestLeave: boolean;
}

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

interface LeaveBalanceItem {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

const statusVariants: Record<LeaveRequest["status"], BadgeVariant> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const formatStatus = (status: LeaveRequest["status"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00.000Z`));

const formatDuration = (duration: LeaveRequest["duration"]) =>
  duration === "half_day" ? "Half Day" : "Full Day";

interface BalanceCardProps {
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

function BalanceCard({
  leaveTypeName,
  allocatedDays,
  usedDays,
  pendingDays,
  remainingDays,
}: BalanceCardProps) {
  const usedRatio =
    allocatedDays > 0
      ? Math.min(100, Math.round((usedDays / allocatedDays) * 100))
      : 0;

  return (
    <Card className="flex flex-col justify-between p-5 transition-shadow hover:shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {leaveTypeName}
          </h3>

          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {allocatedDays} Days Total
          </span>
        </div>

        {/* Progress bar showing consumed leave */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Used: {usedDays}d</span>
            <span>{usedRatio}% allocated</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedRatio > 80 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${usedRatio}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
        <div className="rounded-lg bg-slate-50/70 p-2.5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Used
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-800">
            {usedDays}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50/50 border border-emerald-100/60 p-2.5">
          <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Remaining
          </p>
          <p className="mt-0.5 text-base font-bold text-emerald-700">
            {remainingDays}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50/70 p-2.5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Allocated
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-800">
            {allocatedDays}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50/50 border border-amber-100/60 p-2.5">
          <p className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Pending
          </p>
          <p className="mt-0.5 text-base font-bold text-amber-700">
            {pendingDays}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function MyLeaveClient({
  employeeId,
  canRequestLeave,
}: MyLeaveClientProps) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, requestsResponse, balancesResponse] =
        await Promise.all([
          fetch("/api/employees/me"),
          fetch("/api/leave/requests"),
          fetch("/api/leave/balance"),
        ]);

      const profileResult =
        (await profileResponse.json()) as ApiResponse<EmployeeProfile>;

      const requestsResult = (await requestsResponse.json()) as ApiResponse<
        LeaveRequest[]
      >;

      const balancesResult = (await balancesResponse.json()) as ApiResponse<
        LeaveBalanceItem[]
      >;

      if (!profileResponse.ok) {
        throw new Error(
          profileResult.message ?? "Failed to load employee profile.",
        );
      }

      if (!requestsResponse.ok) {
        throw new Error(
          requestsResult.message ?? "Failed to load leave requests.",
        );
      }

      if (!balancesResponse.ok) {
        throw new Error(
          balancesResult.message ?? "Failed to load leave balances.",
        );
      }

      if (
        !profileResult.data ||
        !Array.isArray(requestsResult.data) ||
        !Array.isArray(balancesResult.data)
      ) {
        throw new Error("Invalid leave page response.");
      }

      if (profileResult.data.id !== employeeId) {
        throw new Error("Employee profile does not match the current session.");
      }

      setEmployee(profileResult.data);
      setLeaveRequests(requestsResult.data);
      setLeaveBalances(balancesResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshData]);

  useEffect(() => {
    if (!showForm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowForm(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  if (isLoading && !employee) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200/80 bg-white p-8 text-sm text-slate-500 shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p>Loading your leave information...</p>
        </div>
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-xs">
        <p className="text-sm font-medium text-rose-700">{error}</p>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => void refreshData()}
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-sm text-slate-500 shadow-xs">
        Employee profile could not be found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Leave
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {employee.firstName} {employee.lastName} ·{" "}
            <span className="font-semibold text-slate-700">
              {employee.employeeCode}
            </span>
          </p>
        </div>

        {canRequestLeave && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowForm(true)}
            leftIcon={<CalendarPlus className="h-4 w-4" />}
          >
            Request Leave
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-xs"
        >
          <p>{error}</p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshData()}
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Leave Balance Section */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Leave Balances
          </h2>
          <p className="text-xs text-slate-500">
            Your dynamic allocation and remaining days for the active period.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl border border-slate-200/80 bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {leaveBalances.map((balance) => (
              <BalanceCard key={balance.leaveTypeId} {...balance} />
            ))}
          </div>
        )}
      </section>

      {/* Leave Request History Section */}
      <section className="space-y-3">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Request History</CardTitle>
                <CardDescription className="mt-1">
                  Track the approval status of your submitted leave
                  applications.
                </CardDescription>
              </div>

              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {leaveRequests.length} Total
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading leave requests...
              </div>
            ) : leaveRequests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Leave Requests Found"
                description="You haven't submitted any leave requests yet. Click 'Request Leave' to apply."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {request.leaveTypeId}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-slate-600">
                        {formatDate(request.startDate)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-slate-600">
                        {formatDate(request.endDate)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDuration(request.duration)}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-xs text-slate-600">
                        <p className="truncate" title={request.reason}>
                          {request.reason}
                        </p>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={statusVariants[request.status] ?? "neutral"}
                          dot
                        >
                          {formatStatus(request.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Request Leave Modal Dialog */}
      {canRequestLeave && showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:p-6"
          onMouseDown={() => setShowForm(false)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-request-dialog-title"
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close leave request form"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div id="leave-request-dialog-title">
              <LeaveRequestForm
                employeeId={employeeId}
                onSuccess={() => {
                  setShowForm(false);
                  void refreshData();
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
