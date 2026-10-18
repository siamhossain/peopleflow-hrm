"use client";

import { useState } from "react";

import { LeaveBalancePreview } from "@/components/leave/LeaveBalancePreview";
import { employees } from "@/data/employees";
import { leaveTypes } from "@/data/leaveTypes";
import type { LeaveDuration } from "@/types/leave";

interface LeaveRequestFormProps {
  employeeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LeaveRequestForm({
  employeeId = "emp-001",
  onSuccess,
  onCancel,
}: LeaveRequestFormProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeId);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState<LeaveDuration>("full_day");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLeaveType = leaveTypes.find(
    (leaveType) => leaveType.id === leaveTypeId,
  );

  const handleLeaveTypeChange = (value: string) => {
    setLeaveTypeId(value);
    setDuration("full_day");
    setError("");
  };

  const handleDurationChange = (value: string) => {
    setDuration(value as LeaveDuration);
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leave/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          leaveTypeId,
          startDate,
          endDate,
          duration,
          reason,
        }),
      });

      const result = (await response.json()) as {
        data?: unknown;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "Failed to submit leave request.");
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while submitting the request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Leave Management
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900">
          Create Leave Request
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Submit a new leave request for an employee.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="employee"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Employee
            </label>
            <select
              id="employee"
              value={selectedEmployeeId}
              onChange={(event) => {
                setSelectedEmployeeId(event.target.value);
                setError("");
              }}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            >
              {employees
                .filter((employee) => employee.status === "active")
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} (
                    {employee.employeeCode})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="leaveType"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Leave Type
            </label>
            <select
              id="leaveType"
              value={leaveTypeId}
              onChange={(event) => handleLeaveTypeChange(event.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setError("");
              }}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                setError("");
              }}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="duration"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Duration
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(event) => handleDurationChange(event.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            >
              <option value="full_day">Full Day</option>
              {selectedLeaveType?.allowHalfDay && (
                <option value="half_day">Half Day</option>
              )}
            </select>
          </div>

          <LeaveBalancePreview
            employeeId={selectedEmployeeId}
            leaveTypeId={leaveTypeId}
          />

          <div className="sm:col-span-2">
            <label
              htmlFor="reason"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Reason
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              required
              rows={4}
              placeholder="Enter the reason for this leave request..."
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-gray-400"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
