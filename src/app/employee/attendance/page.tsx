import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  Filter,
  Hourglass,
  Percent,
  RotateCcw,
  Sun,
  UserCheck,
  UserX,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "../../../../auth";
import {
  getAttendanceList,
  getPaginatedAttendanceList,
} from "@/services/attendanceService";
import type { AttendanceStatus } from "@/types/attendance";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 25;

const statusVariants: Record<AttendanceStatus, BadgeVariant> = {
  present: "success",
  late: "warning",
  half_day: "info",
  absent: "danger",
  leave: "purple",
  holiday: "neutral",
  weekend: "neutral",
};

const formatStatus = (status: AttendanceStatus) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const formatTime = (time?: string) => time || "—";

const formatWorkingHours = (workingMinutes?: number) => {
  if (workingMinutes === undefined) return "—";

  return `${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m`;
};

function isValidMonth(value: string | undefined): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return year >= 1000 && year <= 9999 && month >= 1 && month <= 12;
}

interface MyAttendancePageProps {
  searchParams: Promise<{
    page?: string;
    month?: string;
  }>;
}

export default async function MyAttendancePage({
  searchParams,
}: MyAttendancePageProps) {
  const params = await searchParams;

  // No month filter is applied by default.
  const selectedMonth = isValidMonth(params.month) ? params.month : "2026-08";
  const requestedPage = Number(params.page ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (
    (session.user.role !== "EMPLOYEE" && session.user.role !== "DEMO_VIEWER") ||
    !session.user.employeeId
  ) {
    redirect("/dashboard");
  }

  const employeeId = session.user.employeeId;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      firstName: true,
      lastName: true,
      employeeCode: true,
    },
  });

  if (!employee) {
    redirect("/login");
  }

  const query = {
    employeeId,
    ...(selectedMonth
      ? {
          startDate: `${selectedMonth}-01`,
          endDate: `${selectedMonth}-${String(
            new Date(
              Number(selectedMonth.split("-")[0]),
              Number(selectedMonth.split("-")[1]),
              0,
            ).getDate(),
          ).padStart(2, "0")}`,
        }
      : {}),
  };

  const [attendance, allMatchingRecords] = await Promise.all([
    getPaginatedAttendanceList(query, page, PAGE_SIZE),
    getAttendanceList(query),
  ]);

  const { data: records, total, page: currentPage, totalPages } = attendance;

  // Calculate summary from all matching records, not just this page.
  const workingRecords = allMatchingRecords.filter(
    (record) => record.status !== "holiday" && record.status !== "weekend",
  );

  const presentDays = allMatchingRecords.filter(
    (record) => record.status === "present",
  ).length;

  const lateDays = allMatchingRecords.filter(
    (record) => record.status === "late",
  ).length;

  const halfDays = allMatchingRecords.filter(
    (record) => record.status === "half_day",
  ).length;

  const leaveDays = allMatchingRecords.filter(
    (record) => record.status === "leave",
  ).length;

  const absentDays = allMatchingRecords.filter(
    (record) => record.status === "absent",
  ).length;

  const totalLateMinutes = allMatchingRecords.reduce(
    (sum, record) => sum + (record.lateMinutes ?? 0),
    0,
  );

  const attendancePercentage =
    workingRecords.length === 0
      ? 0
      : Math.round(
          ((presentDays + lateDays + halfDays * 0.5) / workingRecords.length) *
            100,
        );

  const monthLabel = selectedMonth
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(
        new Date(
          Number(selectedMonth.split("-")[0]),
          Number(selectedMonth.split("-")[1]) - 1,
          1,
        ),
      )
    : undefined;

  const getPageHref = (pageNumber: number) => {
    const searchParams = new URLSearchParams({
      page: String(pageNumber),
    });

    if (selectedMonth) {
      searchParams.set("month", selectedMonth);
    }

    return `/employee/attendance?${searchParams.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {employee?.firstName} {employee?.lastName} ·{" "}
            <span className="font-semibold text-slate-700">
              {employee?.employeeCode}
            </span>
          </p>
        </div>

        {monthLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            Viewing: {monthLabel}
          </span>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {monthLabel ? `${monthLabel} Overview` : "Overall Summary"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Working Days"
            value={workingRecords.length}
            icon={CalendarCheck}
            color="indigo"
            description="Scheduled work days"
          />
          <StatCard
            label="Present"
            value={presentDays}
            icon={UserCheck}
            color="emerald"
            description="Completed full shifts"
          />
          <StatCard
            label="Late"
            value={lateDays}
            icon={Clock}
            color="amber"
            description="Check-ins after threshold"
          />
          <StatCard
            label="Half Day"
            value={halfDays}
            icon={Sun}
            color="sky"
            description="Recorded half-day logs"
          />
          <StatCard
            label="Leave"
            value={leaveDays}
            icon={CalendarOff}
            color="purple"
            description="Approved leave days"
          />
          <StatCard
            label="Absent"
            value={absentDays}
            icon={UserX}
            color="rose"
            description="Missed work days"
          />
          <StatCard
            label="Late Minutes"
            value={totalLateMinutes}
            icon={Hourglass}
            color="amber"
            description="Accumulated late time"
          />
          <StatCard
            label="Attendance Rate"
            value={`${attendancePercentage}%`}
            icon={Percent}
            color="emerald"
            description="Period attendance score"
          />
        </div>
      </div>

      {/* Attendance History Card with Filter and Table */}
      <Card>
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription className="mt-1">
                {total} recorded log{total === 1 ? "" : "s"}
                {monthLabel ? ` for ${monthLabel}` : ""}
              </CardDescription>
            </div>

            {/* Month Filter Form */}
            <form method="GET" className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  id="month"
                  name="month"
                  type="month"
                  defaultValue={selectedMonth ?? ""}
                  aria-label="Filter by month"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Filter className="h-3.5 w-3.5" />}
              >
                Apply
              </Button>

              <Link
                href="/employee/attendance"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="Reset month filter"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </Link>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {records.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Attendance Records"
              description={
                monthLabel
                  ? `No attendance records found for ${monthLabel}. Try selecting another month.`
                  : "No attendance records found."
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Late</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(record.date)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={statusVariants[record.status] ?? "neutral"}
                          dot
                        >
                          {formatStatus(record.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">
                        {formatTime(record.checkIn)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">
                        {formatTime(record.checkOut)}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {formatWorkingHours(record.workingMinutes)}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {record.lateMinutes ? (
                          <span className="font-semibold text-amber-600">
                            {record.lateMinutes} min
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={total}
                pageSize={PAGE_SIZE}
                getPageHref={getPageHref}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
