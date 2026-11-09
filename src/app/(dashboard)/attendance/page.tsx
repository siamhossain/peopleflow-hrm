"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, FilterX, Loader2 } from "lucide-react";

import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { departments } from "@/data/departments";
import type {
  AttendanceListItem,
  PaginatedAttendance,
} from "@/types/attendance";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 25;
const DEFAULT_MONTH = "2026-08";

const EMPTY_RESULT: PaginatedAttendance = {
  data: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
];

interface AttendanceApiResponse {
  data?: PaginatedAttendance;
  error?: string;
}

const getMonthDateRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);

  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

const formatMonth = (month: string) => {
  if (!month) return "All Months";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
};

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedAttendance>(EMPTY_RESULT);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchAttendance = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        // Apply date filtering only when the user selects a month.
        if (selectedMonth) {
          const { startDate, endDate } = getMonthDateRange(selectedMonth);

          params.set("startDate", startDate);
          params.set("endDate", endDate);
        }

        if (selectedDepartment) {
          params.set("departmentId", selectedDepartment);
        }

        if (selectedStatus !== "all") {
          params.set("status", selectedStatus);
        }

        const response = await fetch(`/api/attendance?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        const payload = (await response.json()) as AttendanceApiResponse;

        if (!response.ok) {
          throw new Error(
            payload.error || "Failed to fetch attendance records.",
          );
        }

        if (!payload.data) {
          throw new Error("Invalid attendance response.");
        }

        setResult(payload.data);

        // Keep the current page valid if filtering reduces total pages.
        if (page > payload.data.totalPages) {
          setPage(Math.max(1, payload.data.totalPages));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setResult(EMPTY_RESULT);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while fetching attendance.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAttendance();

    return () => {
      controller.abort();
    };
  }, [selectedMonth, selectedStatus, selectedDepartment, page]);

  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedStatus("all");
    setSelectedDepartment("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedMonth || selectedStatus !== "all" || selectedDepartment,
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Time & Attendance
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track daily employee presence, punch-in/out stamps, working hours, and departmental trends.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Filter Attendance Logs
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isLoading || !hasActiveFilters}
            leftIcon={<FilterX className="h-3.5 w-3.5" />}
          >
            Clear filters
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Month Picker */}
          <div>
            <Input
              id="attendance-month"
              type="month"
              label="Select Month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Department Filter */}
          <div>
            <Select
              id="attendance-department"
              label="Department"
              value={selectedDepartment}
              onChange={(event) => {
                setSelectedDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              id="attendance-status"
              label="Attendance Status"
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value);
                setPage(1);
              }}
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Attendance Records Card */}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Attendance Records
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Viewing entries for:{" "}
              <span className="font-medium text-slate-700">
                {formatMonth(selectedMonth)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              ) : (
                `${result.total} total logs`
              )}
            </span>
          </div>
        </div>

        {error ? (
          <div className="p-8">
            <div
              role="alert"
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              Loading attendance records...
            </p>
          </div>
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No attendance records found"
            description="We couldn't find any entries matching your current month or filter settings. Try adjusting your selections."
          />
        ) : (
          <>
            <AttendanceTable records={result.data as AttendanceListItem[]} />

            {/* Reusable Pagination Component */}
            {result.totalPages > 1 && (
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
                totalRecords={result.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
