"use client";

import { useCallback, useEffect, useState } from "react";

import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import type { LeaveRequest } from "@/types/leave";

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

const statusStyles: Record<LeaveRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
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
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{leaveTypeName}</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Allocated</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {allocatedDays}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Used</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{usedDays}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">
            {pendingDays}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold text-green-600">
            {remainingDays}
          </p>
        </div>
      </div>
    </div>
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
      <div className="rounded-xl border bg-white p-8 text-sm text-gray-500">
        Loading your leave information...
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error}</p>

        <button
          type="button"
          onClick={() => void refreshData()}
          className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-xl border bg-white p-8 text-sm text-gray-500">
        Employee profile could not be found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Leave</h1>

          <p className="mt-1 text-sm text-gray-500">
            {employee.firstName} {employee.lastName} · {employee.employeeCode}
          </p>
        </div>

        {canRequestLeave && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Request Leave
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void refreshData()}
            className="shrink-0 text-sm font-medium text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Leave Balance</h2>

          <p className="mt-1 text-sm text-gray-500">
            Your current leave allocation and usage.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading leave balances...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {leaveBalances.map((balance) => (
              <BalanceCard key={balance.leaveTypeId} {...balance} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Leave Request History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your submitted leave requests.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {isLoading ? (
            <p className="px-5 py-12 text-center text-sm text-gray-500">
              Loading leave requests...
            </p>
          ) : leaveRequests.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-gray-500">
                You have no leave requests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    {[
                      "Leave Type",
                      "Start Date",
                      "End Date",
                      "Duration",
                      "Reason",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 font-medium text-gray-600"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {request.leaveTypeId}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(request.startDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(request.endDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDuration(request.duration)}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-gray-600">
                        <p className="truncate">{request.reason}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[request.status]}`}
                        >
                          {formatStatus(request.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {canRequestLeave && showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={() => setShowForm(false)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-request-dialog-title"
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close leave request form"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl leading-none text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
            >
              ×
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
