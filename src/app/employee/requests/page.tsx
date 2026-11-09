"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, FileText, RefreshCw } from "lucide-react";

import { employees } from "@/data/employees";
import { mockSessions } from "@/data/mockSession";
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

export default function MyRequestsPage() {
  const employeeId = mockSessions.employee.employeeId;
  const employee = employees.find((item) => item.id === employeeId);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/leave/requests?employeeId=${encodeURIComponent(employeeId)}`,
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Failed to load leave requests.");
      }

      setRequests(result.data as LeaveRequest[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchRequests();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {employee?.firstName} {employee?.lastName} ·{" "}
            <span className="font-semibold text-slate-700">
              {employee?.employeeCode}
            </span>
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void fetchRequests()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-xs"
        >
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchRequests()}
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Requests Card Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Submitted Leave Applications</CardTitle>
              <CardDescription className="mt-1">
                Complete log of your personal leave applications and current review status.
              </CardDescription>
            </div>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {requests.length} Application{requests.length === 1 ? "" : "s"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
              <p>Loading your leave requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Requests Submitted"
              description="You have not submitted any leave requests yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted On</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {request.id}
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900">
                      {request.leaveTypeId}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-slate-600 font-medium text-xs">
                      {formatDate(request.startDate)} — {formatDate(request.endDate)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-slate-600 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {request.duration === "half_day" ? "Half Day" : "Full Day"}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-xs text-slate-600 text-xs">
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

                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(request.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
