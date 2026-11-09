"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  Clock,
  Hourglass,
  Loader2,
  Percent,
  Sun,
  UserCheck,
  Users,
  UserX,
  XCircle,
  Ban,
} from "lucide-react";

import type { AttendanceRecord } from "@/types/attendance";
import type { LeaveRequest } from "@/types/leave";
import type { DashboardStats } from "@/services/dashboardService";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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

  const approvedLeaveCount = leaveError
    ? "—"
    : leaveRequests.filter((request) => request.status === "approved").length;

  const rejectedLeaveCount = leaveError
    ? "—"
    : leaveRequests.filter((request) => request.status === "rejected").length;

  const cancelledLeaveCount = leaveError
    ? "—"
    : leaveRequests.filter((request) => request.status === "cancelled").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Analytics & Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports & Insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consolidated overview of workforce trends, monthly attendance metrics, and leave request distributions.
          </p>
        </div>
      </div>

      {/* Error Alerts */}
      {dashboardError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-2xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to load dashboard statistics: {dashboardError}</span>
        </div>
      )}

      {leaveError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-2xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Unable to load leave-request totals: {leaveError}</span>
        </div>
      )}

      {/* 6 High-Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Employees"
          value={dashboardLoading ? "…" : stats?.totalEmployees ?? "—"}
          icon={Users}
          color="indigo"
          description="Total workforce directory"
        />

        <StatCard
          label="Attendance Rate"
          value={dashboardLoading ? "…" : stats ? `${stats.attendanceRate}%` : "—"}
          icon={Percent}
          color="emerald"
          description="Average employee presence"
        />

        <StatCard
          label="Pending Leave Requests"
          value={dashboardLoading ? "…" : stats?.pendingLeaveRequests ?? "—"}
          icon={Hourglass}
          color="amber"
          description="Awaiting administrative review"
        />

        <StatCard
          label="Approved Leave Requests"
          value={approvedLeaveCount}
          icon={CheckCircle2}
          color="emerald"
          description="Authorized time-off requests"
        />

        <StatCard
          label="Rejected Leave Requests"
          value={rejectedLeaveCount}
          icon={XCircle}
          color="rose"
          description="Declined applications"
        />

        <StatCard
          label="Cancelled Leave Requests"
          value={cancelledLeaveCount}
          icon={Ban}
          color="slate"
          description="Revoked by applicant or admin"
        />
      </div>

      {/* Monthly Attendance Summary Section */}
      <Card className="p-0 overflow-hidden shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Monthly Attendance Summary
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Aggregated monthly attendance breakdown for{" "}
              <span className="font-semibold text-slate-800">
                {formatMonth(selectedMonth)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="report-month"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Select Month:
            </label>
            <input
              id="report-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {attendanceLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs font-medium text-slate-500">
                Aggregating monthly attendance records...
              </p>
            </div>
          ) : attendanceError ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{attendanceError}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metric grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-emerald-800">Attendance Rate</p>
                    <Percent className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700">
                    {monthlyAttendance.attendancePercentage}%
                  </p>
                  <p className="mt-0.5 text-[11px] text-emerald-600/80">Monthly presence ratio</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Present Days</p>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {monthlyAttendance.presentDays}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">On-time presences</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Late Days</p>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
                    {monthlyAttendance.lateDays}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Late check-in logs</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Half Day</p>
                    <Sun className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-sky-700">
                    {monthlyAttendance.halfDays}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Half-day shifts</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Absent Days</p>
                    <UserX className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-rose-700">
                    {monthlyAttendance.absentDays}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Unexcused absences</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">On Leave</p>
                    <CalendarOff className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-purple-700">
                    {monthlyAttendance.leaveDays}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Approved leaves</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Late Minutes</p>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {monthlyAttendance.totalLateMinutes}
                    <span className="text-xs font-normal text-slate-500 ml-1">min</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Cumulative delay time</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">Total Records</p>
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    {monthlyAttendance.totalRecords}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Total processed punches</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Section: Daily Attendance Breakdown & Employee Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Attendance Summary Card */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Attendance Summary</CardTitle>
                <CardDescription>
                  Snapshot for the most recent system attendance date.
                </CardDescription>
              </div>
              <Badge variant="indigo" size="sm">
                Latest Day
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs">Loading daily statistics...</span>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Present</p>
                    <p className="mt-1 text-xl font-bold text-emerald-700">
                      {stats.presentToday}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Late</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">
                      {stats.lateToday}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Half Day</p>
                    <p className="mt-1 text-xl font-bold text-sky-700">
                      {stats.halfDayToday}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">Absent</p>
                    <p className="mt-1 text-xl font-bold text-rose-700">
                      {stats.absentToday}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs text-slate-500">On Leave</p>
                    <p className="mt-1 text-xl font-bold text-purple-700">
                      {stats.onLeaveToday}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Referenced date in database:{" "}
                    <span className="font-semibold text-slate-700">
                      {reportDate || "Today"}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Daily attendance statistics are unavailable.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Employee Overview Card */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workforce Overview</CardTitle>
                <CardDescription>
                  Organizational employee roster and active status ratio.
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm">
                Directory
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-xs">Loading employee metrics...</span>
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/60">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {stats.totalEmployees} Registered Personnel
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Active staff members eligible for daily attendance monitoring and leave quotas on {reportDate}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">System Reporting Note</p>
                  <p className="mt-0.5 text-slate-500">
                    Statistics are calculated live from validated database entries and synced across administrative dashboards.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Employee statistics are unavailable.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
