"use client";

import { useEffect, useState } from "react";

import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { departments } from "@/data/departments";
import type {
  AttendanceListItem,
  PaginatedAttendance,
} from "@/services/attendanceService";

const DEFAULT_MONTH = "2026-08";
const PAGE_SIZE = 25;

const EMPTY_RESULT: PaginatedAttendance = {
  data: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
};

const statusOptions: {
  value: AttendanceListItem["status"] | "all";
  label: string;
}[] = [
  { value: "all", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
];

const getMonthDateRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);

  const startDate = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const endDate = `${year}-${String(monthNumber).padStart(2, "0")}-${String(
    lastDay,
  ).padStart(2, "0")}`;

  return { startDate, endDate };
};

const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
};

interface AttendanceApiResponse {
  data?: PaginatedAttendance;
  error?: string;
}

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
  const [selectedStatus, setSelectedStatus] = useState<
    AttendanceListItem["status"] | "all"
  >("all");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedAttendance>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAttendance() {
      setIsLoading(true);
      setError("");

      try {
        const { startDate, endDate } = getMonthDateRange(selectedMonth);

        const params = new URLSearchParams({
          startDate,
          endDate,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });

        if (selectedDepartment) {
          params.set("departmentId", selectedDepartment);
        }

        if (selectedStatus !== "all") {
          params.set("status", selectedStatus);
        }

        const response = await fetch(`/api/attendance?${params.toString()}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as AttendanceApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(
            payload.error ?? "Failed to load attendance records.",
          );
        }

        setResult(payload.data);

        // Keep the UI aligned with the actual page returned by the API.
        if (payload.data.page !== page) {
          setPage(payload.data.page);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setResult(EMPTY_RESULT);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load attendance records.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchAttendance();

    return () => controller.abort();
  }, [selectedMonth, selectedStatus, selectedDepartment, page]);

  const firstRecord =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;

  const lastRecord = Math.min(result.page * result.pageSize, result.total);

  const clearFilters = () => {
    setSelectedStatus("all");
    setSelectedDepartment("");
    setPage(1);
  };

  return (
    <section>
      <div>
        <p className="text-sm font-medium text-gray-500">
          Attendance Management
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">Attendance</h1>

        <p className="mt-2 text-sm text-gray-600">
          Review employee attendance records by month, department, and status.
        </p>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="attendance-month"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Month
            </label>

            <input
              id="attendance-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="attendance-department"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Department
            </label>

            <select
              id="attendance-department"
              value={selectedDepartment}
              onChange={(event) => {
                setSelectedDepartment(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            >
              <option value="">All Departments</option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="attendance-status"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="attendance-status"
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(
                  event.target.value as AttendanceListItem["status"] | "all",
                );
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {isLoading
              ? "…"
              : `${firstRecord}–${lastRecord} of ${result.total}`}
          </span>{" "}
          records for{" "}
          <span className="font-semibold text-gray-900">
            {formatMonth(selectedMonth)}
          </span>
        </p>

        <button
          type="button"
          onClick={clearFilters}
          disabled={
            isLoading || (selectedStatus === "all" && !selectedDepartment)
          }
          className="text-left text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40 sm:text-right"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-xl border bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-sm text-gray-500">Loading attendance records…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white px-6 py-8 text-center shadow-sm">
            <p className="font-medium text-red-700">
              Could not load attendance records
            </p>
            <p className="mt-1 text-sm text-gray-600">{error}</p>
          </div>
        ) : result.data.length > 0 ? (
          <AttendanceTable records={result.data} />
        ) : (
          <div className="rounded-xl border bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-medium text-gray-900">
              No attendance records found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try selecting another month or changing the filters.
            </p>
          </div>
        )}
      </div>

      {!isLoading && !error && result.totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Page {result.page} of {result.totalPages}
            <span className="ml-2 text-gray-400">({result.total} records)</span>
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={result.page === 1}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {(() => {
              const currentPage = result.page;
              const totalPages = result.totalPages;

              let pages: (number | "ellipsis")[];

              if (totalPages <= 5) {
                pages = Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                );
              } else if (currentPage <= 3) {
                pages = [1, 2, 3, 4, "ellipsis", totalPages];
              } else if (currentPage >= totalPages - 2) {
                pages = [
                  1,
                  "ellipsis",
                  totalPages - 3,
                  totalPages - 2,
                  totalPages - 1,
                  totalPages,
                ];
              } else {
                pages = [
                  1,
                  "ellipsis",
                  currentPage - 1,
                  currentPage,
                  currentPage + 1,
                  "ellipsis",
                  totalPages,
                ];
              }

              return pages.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1.5 text-sm text-gray-400"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    disabled={isLoading || item === currentPage}
                    aria-current={item === currentPage ? "page" : undefined}
                    aria-label={`Go to page ${item}`}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-default ${
                      item === currentPage
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item}
                  </button>
                ),
              );
            })()}

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(result.totalPages, current + 1))
              }
              disabled={result.page === result.totalPages}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
