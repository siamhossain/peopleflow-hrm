"use client";

import { useEffect, useMemo, useState } from "react";

import type { AttendanceRecord } from "@/types/attendance";
import type { LeaveRequest } from "@/types/leave";
import type { DashboardStats } from "@/services/dashboardService";

const DEFAULT_MONTH = "2026-08";

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

interface DashboardApiResponse {
  data?: {
    date: string;
    stats: DashboardStats;
  };
  error?: string;
}

interface AttendanceApiResponse {
  data?: {
    data: AttendanceRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
}

interface LeaveRequestsApiResponse {
  data?: LeaveRequest[];
  error?: string;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);

  const [reportDate, setReportDate] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveError, setLeaveError] = useState("");

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  // Load database-backed dashboard statistics.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboardStats() {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const response = await fetch("/api/dashboard", {
          signal: controller.signal,
        });

        const result = (await response.json()) as DashboardApiResponse;

        if (!response.ok || !result.data) {
          throw new Error(
            result.error ?? "Failed to load dashboard statistics.",
          );
        }

        if (!controller.signal.aborted) {
          setReportDate(result.data.date);
          setStats(result.data.stats);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard statistics.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setDashboardLoading(false);
        }
      }
    }

    void fetchDashboardStats();

    return () => controller.abort();
  }, []);

  // Load leave requests from the API.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchLeaveRequests() {
      setLeaveError("");

      try {
        const response = await fetch("/api/leave/requests?all=true", {
          signal: controller.signal,
        });

        const result = (await response.json()) as LeaveRequestsApiResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to load leave requests.");
        }

        if (!controller.signal.aborted) {
          setLeaveRequests(result.data ?? []);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setLeaveError(
            error instanceof Error
              ? error.message
              : "Failed to load leave requests.",
          );
        }
      }
    }

    void fetchLeaveRequests();

    return () => controller.abort();
  }, []);

  // Load every page of monthly attendance records.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMonthlyAttendance() {
      setAttendanceLoading(true);
      setAttendanceError("");
      setAttendanceRecords([]);

      try {
        const { startDate, endDate } = getMonthDateRange(selectedMonth);
        const pageSize = 100;

        const firstParams = new URLSearchParams({
          startDate,
          endDate,
          page: "1",
          pageSize: String(pageSize),
        });

        const firstResponse = await fetch(
          `/api/attendance?${firstParams.toString()}`,
          { signal: controller.signal },
        );

        const firstResult =
          (await firstResponse.json()) as AttendanceApiResponse;

        if (!firstResponse.ok || !firstResult.data) {
          throw new Error(
            firstResult.error ?? "Failed to load monthly attendance.",
          );
        }

        const allRecords = [...firstResult.data.data];
        const totalPages = firstResult.data.totalPages;

        for (let page = 2; page <= totalPages; page += 1) {
          if (controller.signal.aborted) {
            return;
          }

          const params = new URLSearchParams({
            startDate,
            endDate,
            page: String(page),
            pageSize: String(pageSize),
          });

          const response = await fetch(`/api/attendance?${params.toString()}`, {
            signal: controller.signal,
          });

          const result = (await response.json()) as AttendanceApiResponse;

          if (!response.ok || !result.data) {
            throw new Error(
              result.error ?? `Failed to load attendance page ${page}.`,
            );
          }

          allRecords.push(...result.data.data);
        }

        if (!controller.signal.aborted) {
          setAttendanceRecords(allRecords);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setAttendanceRecords([]);
          setAttendanceError(
            error instanceof Error
              ? error.message
              : "Failed to load monthly attendance.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setAttendanceLoading(false);
        }
      }
    }

    void fetchMonthlyAttendance();

    return () => controller.abort();
  }, [selectedMonth]);

  const monthlyAttendance = useMemo(() => {
    const presentDays = attendanceRecords.filter(
      (record) => record.status === "present",
    ).length;

    const lateDays = attendanceRecords.filter(
      (record) => record.status === "late",
    ).length;

    const halfDays = attendanceRecords.filter(
      (record) => record.status === "half_day",
    ).length;

    const absentDays = attendanceRecords.filter(
      (record) => record.status === "absent",
    ).length;

    const leaveDays = attendanceRecords.filter(
      (record) => record.status === "leave",
    ).length;

    const totalWorkingRecords =
      presentDays + lateDays + halfDays + absentDays + leaveDays;

    const attendanceDays = presentDays + lateDays + halfDays * 0.5;

    const attendancePercentage =
      totalWorkingRecords === 0
        ? 0
        : Number(((attendanceDays / totalWorkingRecords) * 100).toFixed(2));

    const totalLateMinutes = attendanceRecords.reduce(
      (total, record) => total + (record.lateMinutes ?? 0),
      0,
    );

    return {
      totalRecords: attendanceRecords.length,
      presentDays,
      lateDays,
      halfDays,
      absentDays,
      leaveDays,
      attendancePercentage,
      totalLateMinutes,
    };
  }, [attendanceRecords]);

  const reportCards = [
    {
      label: "Total Employees",
      value: stats?.totalEmployees ?? "—",
    },
    {
      label: "Attendance Rate",
      value: stats ? `${stats.attendanceRate}%` : "—",
    },
    {
      label: "Pending Leave Requests",
      value: stats?.pendingLeaveRequests ?? "—",
    },
    {
      label: "Approved Leave Requests",
      value: leaveError
        ? "—"
        : leaveRequests.filter((request) => request.status === "approved")
            .length,
    },
    {
      label: "Rejected Leave Requests",
      value: leaveError
        ? "—"
        : leaveRequests.filter((request) => request.status === "rejected")
            .length,
    },
    {
      label: "Cancelled Leave Requests",
      value: leaveError
        ? "—"
        : leaveRequests.filter((request) => request.status === "cancelled")
            .length,
    },
  ];

  return (
    <section>
      <div>
        <p className="text-sm font-medium text-gray-500">HRM Reports</p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">Reports</h1>

        <p className="mt-2 text-sm text-gray-600">
          Overview of employee, attendance, and leave management data.
        </p>
      </div>

      {dashboardError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          Unable to load dashboard statistics: {dashboardError}
        </div>
      )}

      {leaveError && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          Unable to load leave-request totals: {leaveError}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {dashboardLoading ? "…" : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Attendance Summary
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Attendance overview for {formatMonth(selectedMonth)}.
            </p>
          </div>

          <div>
            <label
              htmlFor="report-month"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Month
            </label>

            <input
              id="report-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {attendanceLoading ? (
          <p className="mt-6 text-sm text-gray-500">
            Loading monthly attendance…
          </p>
        ) : attendanceError ? (
          <p role="alert" className="mt-6 text-sm text-red-700">
            {attendanceError}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.attendancePercentage}%
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Present</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.presentDays}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Late</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.lateDays}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Half Day</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.halfDays}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Absent</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.absentDays}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.leaveDays}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Late Minutes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.totalLateMinutes}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {monthlyAttendance.totalRecords}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Daily Attendance Summary
        </h2>

        {dashboardLoading ? (
          <p className="mt-4 text-sm text-gray-500">
            Loading daily attendance…
          </p>
        ) : stats ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.presentToday}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.lateToday}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Half Day</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.halfDayToday}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.absentToday}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {stats.onLeaveToday}
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs text-gray-500">
              Based on the latest attendance date in the system: {reportDate}
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Daily attendance statistics are unavailable.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Employee Overview
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          {dashboardLoading
            ? "Loading employee data…"
            : stats
              ? `The database currently contains ${stats.totalEmployees} employees eligible for the selected attendance date.`
              : "Employee statistics are unavailable."}
        </p>
      </div>
    </section>
  );
}
