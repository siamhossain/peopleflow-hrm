"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeaveRequest } from "@/types/leave";
import type { AttendanceRecord } from "@/types/attendance";

import { employees } from "@/data/employees";
import {
  getDashboardStats,
  getLatestAttendanceDate,
} from "@/services/dashboardService";

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

interface AttendanceApiResponse {
  data?: AttendanceRecord[];
  error?: string;
}

interface LeaveRequestsApiResponse {
  data?: LeaveRequest[];
  error?: string;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState("");

  const reportDate = getLatestAttendanceDate();
  const stats = getDashboardStats(reportDate);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLeaveRequests() {
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

        console.error("Failed to load leave requests:", error);
      }
    }

    void fetchLeaveRequests();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMonthlyAttendance() {
      setAttendanceLoading(true);
      setAttendanceError("");

      try {
        const { startDate, endDate } = getMonthDateRange(selectedMonth);
        const params = new URLSearchParams({ startDate, endDate });

        const response = await fetch(`/api/attendance?${params.toString()}`, {
          signal: controller.signal,
        });

        const result = (await response.json()) as AttendanceApiResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Failed to load monthly attendance.");
        }

        setAttendanceRecords(result.data ?? []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setAttendanceRecords([]);
        setAttendanceError(
          error instanceof Error
            ? error.message
            : "Failed to load monthly attendance.",
        );
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
      value: stats.totalEmployees,
    },
    {
      label: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
    },
    {
      label: "Pending Leave Requests",
      value: stats.pendingLeaveRequests,
    },
    {
      label: "Approved Leave Requests",
      value: leaveRequests.filter((request) => request.status === "approved")
        .length,
    },
    {
      label: "Rejected Leave Requests",
      value: leaveRequests.filter((request) => request.status === "rejected")
        .length,
    },
    {
      label: "Cancelled Leave Requests",
      value: leaveRequests.filter((request) => request.status === "cancelled")
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {card.value}
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
          <p className="mt-6 text-sm text-red-700">{attendanceError}</p>
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
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Employee Overview
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          The current employee dataset contains {employees.length} employee
          records, including active, inactive, on-leave, and resigned employees.
        </p>
      </div>
    </section>
  );
}
