"use client";

import { useCallback, useEffect, useState } from "react";

import { employees } from "@/data/employees";
import { leaveTypes } from "@/data/leaveTypes";
import { mockSessions } from "@/data/mockSession";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import type { LeaveRequest } from "@/types/leave";

interface LeaveBalanceItem {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
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
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {allocatedDays}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Used</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{usedDays}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-lg font-semibold text-amber-600">
            {pendingDays}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-green-600">
            {remainingDays}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MyLeavePage() {
  const employeeId = mockSessions.employee.employeeId;
  const employee = employees.find((item) => item.id === employeeId);

  const [showForm, setShowForm] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = `employeeId=${encodeURIComponent(employeeId)}`;

      const [requestsResponse, balancesResponse] = await Promise.all([
        fetch(`/api/leave/requests?${query}`),
        fetch(`/api/leave/balance?${query}`),
      ]);

      const requestsResult = await requestsResponse.json();
      const balancesResult = await balancesResponse.json();

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

      setLeaveRequests(requestsResult.data as LeaveRequest[]);
      setLeaveBalances(balancesResult.data as LeaveBalanceItem[]);
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

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshData]);

  useEffect(() => {
    if (!showForm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowForm(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  if (!employee) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">
          Employee profile could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave</h1>
          <p className="mt-1 text-sm text-gray-500">
            {employee.firstName} {employee.lastName} · {employee.employeeCode}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Request Leave
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="font-medium underline"
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
                  {leaveRequests.map((request) => {
                    const leaveType = leaveTypes.find(
                      (item) => item.id === request.leaveTypeId,
                    );

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {leaveType?.name ?? request.leaveTypeId}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showForm && (
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
