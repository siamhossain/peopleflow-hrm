"use client";

import { useEffect, useState } from "react";

import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { departments } from "@/data/departments";
import type {
  AttendanceListItem,
  PaginatedAttendance,
} from "@/types/attendance";

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

  const firstRecord =
    result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;

  const lastRecord = Math.min(result.page * PAGE_SIZE, result.total);

  const clearFilters = () => {
    setSelectedMonth("");
    setSelectedStatus("all");
    setSelectedDepartment("");
    setPage(1);
  };

  const getPageNumbers = () => {
    const totalPages = result.totalPages;
    const currentPage = result.page;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > result.totalPages || nextPage === page) {
      return;
    }

    setPage(nextPage);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>

        <p className="mt-1 text-sm text-gray-500">
          View and manage employee attendance records.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>

          <button
            type="button"
            onClick={clearFilters}
            disabled={
              isLoading ||
              (!selectedMonth &&
                selectedStatus === "all" &&
                !selectedDepartment)
            }
            className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Original month picker */}
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

          {/* Department filter */}
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

          {/* Status filter */}
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
                setSelectedStatus(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Attendance records */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Attendance Records</h2>

            <p className="mt-1 text-sm text-gray-500">
              {formatMonth(selectedMonth)}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            {isLoading ? "Loading records..." : `${result.total} total records`}
          </p>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              Loading attendance records...
            </p>
          </div>
        ) : result.data.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-gray-900">
              No attendance records found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try changing or clearing your filters.
            </p>
          </div>
        ) : (
          <>
            <AttendanceTable records={result.data as AttendanceListItem[]} />

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-5 py-4">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-900">{firstRecord}</span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">{lastRecord}</span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {result.total}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {getPageNumbers().map((pageNumber, index) => (
                  <button
                    key={`${pageNumber}-${index}`}
                    type="button"
                    disabled={pageNumber === "..."}
                    onClick={() => {
                      if (typeof pageNumber === "number") {
                        goToPage(pageNumber);
                      }
                    }}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${
                      pageNumber === page
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    } ${
                      pageNumber === "..."
                        ? "cursor-default border-transparent"
                        : ""
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= result.totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
