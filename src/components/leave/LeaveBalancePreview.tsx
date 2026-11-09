"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarCheck, Clock, Loader2 } from "lucide-react";

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
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/75 p-4 sm:col-span-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Calculating remaining leave allowance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 sm:col-span-2"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 sm:col-span-2 shadow-2xs">
      <div className="flex items-center justify-between border-b border-indigo-100/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Leave Allowance Overview
            </p>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Current balance quota for {balance.leaveTypeName}
          </p>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Allocated */}
        <div className="rounded-lg border border-slate-200/60 bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Allocated</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {balance.allocatedDays}
          </p>
          <p className="text-[11px] text-slate-400">days</p>
        </div>

        {/* Used */}
        <div className="rounded-lg border border-slate-200/60 bg-white p-3 text-center shadow-2xs">
          <p className="text-[11px] font-medium text-slate-500">Used</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-700">
            {balance.usedDays}
          </p>
          <p className="text-[11px] text-slate-400">days</p>
        </div>

        {/* Pending */}
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <p className="text-[11px] font-medium text-amber-700">Pending</p>
          </div>
          <p className="mt-1 text-xl font-bold tracking-tight text-amber-700">
            {balance.pendingDays}
          </p>
          <p className="text-[11px] text-amber-600/70">days</p>
        </div>

        {/* Remaining */}
        <div className="rounded-lg border border-indigo-200/60 bg-indigo-50/60 p-3 text-center shadow-2xs">
          <p className="text-[11px] font-semibold text-indigo-700">Remaining</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight text-indigo-600">
            {balance.remainingDays}
          </p>
          <p className="text-[11px] text-indigo-500">days</p>
        </div>
      </div>
    </div>
  );
}
