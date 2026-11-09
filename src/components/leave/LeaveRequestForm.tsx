"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarPlus, Loader2 } from "lucide-react";

import { LeaveBalancePreview } from "@/components/leave/LeaveBalancePreview";
import type { LeaveDuration, LeaveType } from "@/types/leave";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface LeaveRequestFormProps {
  employeeId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

interface PaginatedEmployees {
  data: ApiEmployee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface ApiLeaveType {
  id: string;
  name: string;
  code: string;
  defaultDays: number;
  allowHalfDay: boolean;
}

export function LeaveRequestForm({
  employeeId,
  onSuccess,
  onCancel,
}: LeaveRequestFormProps) {
  const isEmployeePortal = employeeId !== undefined;

  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    employeeId ?? "",
  );
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState<LeaveDuration>("full_day");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLeaveType = leaveTypes.find(
    (leaveType) => leaveType.id === leaveTypeId,
  );

  useEffect(() => {
    let cancelled = false;

    const loadFormData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const leaveTypesResponse = await fetch("/api/leave/types");

        const leaveTypesResult =
          (await leaveTypesResponse.json()) as ApiResponse<ApiLeaveType[]>;

        if (!leaveTypesResponse.ok) {
          throw new Error(
            leaveTypesResult.message ?? "Failed to load leave types.",
          );
        }

        if (!Array.isArray(leaveTypesResult.data)) {
          throw new Error("Invalid leave types response.");
        }

        let activeEmployees: ApiEmployee[] = [];

        // Only Admin needs to load the employee list.
        if (!isEmployeePortal) {
          const employeesResponse = await fetch(
            "/api/employees?page=1&pageSize=100",
          );

          const employeesResult =
            (await employeesResponse.json()) as ApiResponse<
              PaginatedEmployees | ApiEmployee[]
            >;

          if (!employeesResponse.ok) {
            throw new Error(
              employeesResult.message ?? "Failed to load employees.",
            );
          }

          const employeeData = Array.isArray(employeesResult.data)
            ? employeesResult.data
            : employeesResult.data?.data;

          if (!Array.isArray(employeeData)) {
            throw new Error("Invalid employees response.");
          }

          activeEmployees = employeeData.filter(
            (employee) => employee.status.toLowerCase() === "active",
          );
        }

        if (cancelled) return;

        setLeaveTypes(
          leaveTypesResult.data.map((leaveType) => ({
            id: leaveType.id,
            name: leaveType.name,
            code: leaveType.code,
            annualAllocation: leaveType.defaultDays,
            allowHalfDay: leaveType.allowHalfDay,
          })),
        );

        if (!isEmployeePortal) {
          setEmployees(activeEmployees);

          setSelectedEmployeeId((currentId) => {
            if (
              currentId &&
              activeEmployees.some((employee) => employee.id === currentId)
            ) {
              return currentId;
            }

            return activeEmployees[0]?.id ?? "";
          });
        } else {
          setSelectedEmployeeId(employeeId ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load leave request form data.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFormData();

    return () => {
      cancelled = true;
    };
  }, [employeeId, isEmployeePortal]);

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

    if (!selectedEmployeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!leaveTypeId) {
      setError("Please select a leave type.");
      return;
    }

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

      const result = (await response.json()) as ApiResponse<unknown>;

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
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/75 px-6 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
          <CalendarPlus className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Create Leave Application
          </h2>
          <p className="text-xs text-slate-500">
            Submit a new time-off request with duration and quota allocation check.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs font-medium text-slate-500">
            Loading leave categories and balances...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {!isEmployeePortal && (
              <div>
                <Select
                  id="employee"
                  label="Select Employee"
                  value={selectedEmployeeId}
                  onChange={(event) => {
                    setSelectedEmployeeId(event.target.value);
                    setError("");
                  }}
                  required
                  disabled={employees.length === 0}
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName} (
                      {employee.employeeCode})
                    </option>
                  ))}
                </Select>

                {employees.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No active employees are available.
                  </p>
                )}
              </div>
            )}

            <div>
              <Select
                id="leaveType"
                label="Leave Category"
                value={leaveTypeId}
                onChange={(event) => handleLeaveTypeChange(event.target.value)}
                required
                disabled={leaveTypes.length === 0}
              >
                <option value="">Select leave category</option>
                {leaveTypes.map((leaveType) => (
                  <option key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </option>
                ))}
              </Select>

              {leaveTypes.length === 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  No active leave categories are available.
                </p>
              )}
            </div>

            <div>
              <Input
                id="startDate"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setError("");
                }}
                required
              />
            </div>

            <div>
              <Input
                id="endDate"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setError("");
                }}
                required
                min={startDate || undefined}
              />
            </div>

            <div className={!isEmployeePortal ? "" : "sm:col-span-2"}>
              <Select
                id="duration"
                label="Duration Mode"
                value={duration}
                onChange={(event) => handleDurationChange(event.target.value)}
              >
                <option value="full_day">Full Day (1.0)</option>
                {selectedLeaveType?.allowHalfDay && (
                  <option value="half_day">Half Day (0.5)</option>
                )}
              </Select>
            </div>

            <LeaveBalancePreview
              employeeId={selectedEmployeeId}
              leaveTypeId={leaveTypeId}
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="reason"
                className="mb-1.5 block text-xs font-medium text-slate-700 select-none"
              >
                Reason / Remarks <span className="text-rose-500">*</span>
              </label>

              <textarea
                id="reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                required
                rows={3}
                placeholder="State the reason for taking leave..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 sm:col-span-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={
                isSubmitting ||
                !selectedEmployeeId ||
                !leaveTypeId ||
                (!isEmployeePortal && employees.length === 0) ||
                leaveTypes.length === 0
              }
            >
              Submit Application
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
