"use client";

import { useEffect, useState } from "react";

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

interface LeaveBalancePreviewProps {
  employeeId: string;
  leaveTypeId: string;
}

export function LeaveBalancePreview({
  employeeId,
  leaveTypeId,
}: LeaveBalancePreviewProps) {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchBalance() {
      setIsLoading(true);
      setError(null);
      setBalance(null);

      try {
        const response = await fetch(
          `/api/leave/balance?employeeId=${encodeURIComponent(employeeId)}`,
        );

        const result = (await response.json()) as {
          data?: LeaveBalance[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message ?? "Failed to load leave balance.");
        }

        const selectedBalance =
          result.data?.find((item) => item.leaveTypeId === leaveTypeId) ?? null;

        if (isActive) {
          setBalance(selectedBalance);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading the leave balance.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void fetchBalance();

    return () => {
      isActive = false;
    };
  }, [employeeId, leaveTypeId]);

  if (!employeeId || !leaveTypeId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
        <p className="text-sm text-gray-600">Loading leave balance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 sm:col-span-2"
      >
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Leave Balance
        </p>

        <p className="mt-1 text-sm text-gray-600">
          Current balance for the selected employee and leave type.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500">Allocated</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {balance.allocatedDays}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Used</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {balance.usedDays}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {balance.pendingDays}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {balance.remainingDays}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>
      </div>
    </div>
  );
}
