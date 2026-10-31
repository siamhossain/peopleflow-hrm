import Link from "next/link";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "../../../../auth";
import {
  getAttendanceList,
  getPaginatedAttendanceList,
} from "@/services/attendanceService";
import type { AttendanceStatus } from "@/types/attendance";

const PAGE_SIZE = 25;

const statusStyles: Record<AttendanceStatus, string> = {
  present: "bg-green-50 text-green-700",
  late: "bg-amber-50 text-amber-700",
  half_day: "bg-blue-50 text-blue-700",
  absent: "bg-red-50 text-red-700",
  leave: "bg-purple-50 text-purple-700",
  holiday: "bg-gray-100 text-gray-600",
  weekend: "bg-gray-100 text-gray-600",
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

interface SummaryCardProps {
  label: string;
  value: string | number;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages]);

  for (
    let page = Math.max(1, currentPage - 1);
    page <= Math.min(totalPages, currentPage + 1);
    page++
  ) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage !== undefined && page - previousPage > 1) {
      result.push("ellipsis");
    }

    result.push(page);
  });

  return result;
}

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  // Current month and previous 11 months.
  for (let offset = 0; offset < 12; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;

    options.push({
      value,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date),
    });
  }

  return options;
}

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
  const selectedMonth = isValidMonth(params.month) ? params.month : undefined;

  const requestedPage = Number(params.page ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "EMPLOYEE" || !session.user.employeeId) {
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

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const getPageHref = (pageNumber: number) => {
    const searchParams = new URLSearchParams({
      page: String(pageNumber),
    });

    if (selectedMonth) {
      searchParams.set("month", selectedMonth);
    }

    return `/employee/attendance?${searchParams.toString()}`;
  };

  const firstRecord = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastRecord = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

        <p className="mt-1 text-sm text-gray-500">
          {employee?.firstName} {employee?.lastName} · {employee?.employeeCode}
        </p>
      </div>

      {/* Summary cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {monthLabel ? `${monthLabel} Summary` : "Overall Summary"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Working Days" value={workingRecords.length} />
          <SummaryCard label="Present" value={presentDays} />
          <SummaryCard label="Late" value={lateDays} />
          <SummaryCard label="Half Day" value={halfDays} />
          <SummaryCard label="Leave" value={leaveDays} />
          <SummaryCard label="Absent" value={absentDays} />
          <SummaryCard label="Late Minutes" value={totalLateMinutes} />
          <SummaryCard label="Attendance" value={`${attendancePercentage}%`} />
        </div>
      </div>

      {/* Attendance history and its filter */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Attendance History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {total} attendance records
                {monthLabel ? ` for ${monthLabel}` : ""}
              </p>
            </div>

            {total > 0 && (
              <p className="text-sm text-gray-500">
                Showing {firstRecord}–{lastRecord} of {total}
              </p>
            )}
          </div>

          {/* Filter is inside the attendance history card */}
          <form
            action="/employee/attendance"
            method="GET"
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1">
              <label
                htmlFor="attendance-month"
                className="block text-sm font-medium text-gray-700"
              >
                Filter by month
              </label>

              <select
                id="attendance-month"
                name="month"
                defaultValue={selectedMonth ?? ""}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Months</option>

                {getMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply Filter
            </button>
          </form>
        </div>

        {records.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500">
              {monthLabel
                ? `No attendance records found for ${monthLabel}.`
                : "No attendance records found."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Check In
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Check Out
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Working Hours
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Late Minutes
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[record.status]}`}
                        >
                          {formatStatus(record.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatTime(record.checkOut)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatWorkingHours(record.workingMinutes)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {record.lateMinutes ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>

                <nav
                  aria-label="Attendance pagination"
                  className="flex flex-wrap items-center gap-1"
                >
                  {currentPage > 1 ? (
                    <Link
                      href={getPageHref(currentPage - 1)}
                      className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="cursor-not-allowed rounded-lg border px-3 py-2 text-sm font-medium text-gray-400"
                    >
                      Previous
                    </span>
                  )}

                  {pageNumbers.map((pageNumber, index) =>
                    pageNumber === "ellipsis" ? (
                      <span
                        key={`ellipsis-${index}`}
                        aria-hidden="true"
                        className="px-2 py-2 text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={pageNumber}
                        href={getPageHref(pageNumber)}
                        aria-current={
                          pageNumber === currentPage ? "page" : undefined
                        }
                        className={`min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                          pageNumber === currentPage
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    ),
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={getPageHref(currentPage + 1)}
                      className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="cursor-not-allowed rounded-lg border px-3 py-2 text-sm font-medium text-gray-400"
                    >
                      Next
                    </span>
                  )}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
