import { employees } from "@/data/employees";
import { mockSessions } from "@/data/mockSession";
import {
  calculateAttendanceSummary,
  getEmployeeAttendance,
} from "@/services/attendanceService";
import type { AttendanceStatus } from "@/types/attendance";

const statusStyles: Record<AttendanceStatus, string> = {
  present: "bg-green-50 text-green-700",
  late: "bg-amber-50 text-amber-700",
  half_day: "bg-blue-50 text-blue-700",
  absent: "bg-red-50 text-red-700",
  leave: "bg-purple-50 text-purple-700",
  holiday: "bg-gray-100 text-gray-600",
  weekend: "bg-gray-100 text-gray-600",
};

const formatStatus = (status: AttendanceStatus) => {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const formatTime = (time?: string) => {
  if (!time) {
    return "—";
  }

  return time;
};

const formatWorkingHours = (workingMinutes?: number) => {
  if (workingMinutes === undefined) {
    return "—";
  }

  const hours = Math.floor(workingMinutes / 60);
  const minutes = workingMinutes % 60;

  return `${hours}h ${minutes}m`;
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

export default async function MyAttendancePage() {
  const employeeId = mockSessions.employee.employeeId;

  const employee = employees.find((item) => item.id === employeeId);

  const [records, summary] = await Promise.all([
    getEmployeeAttendance(employeeId),
    calculateAttendanceSummary(employeeId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

        <p className="mt-1 text-sm text-gray-500">
          {employee?.firstName} {employee?.lastName} · {employee?.employeeCode}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Working Days" value={summary.totalWorkingDays} />

        <SummaryCard label="Present" value={summary.presentDays} />

        <SummaryCard label="Late" value={summary.lateDays} />

        <SummaryCard label="Half Day" value={summary.halfDays} />

        <SummaryCard label="Leave" value={summary.leaveDays} />

        <SummaryCard label="Absent" value={summary.absentDays} />

        <SummaryCard label="Late Minutes" value={summary.totalLateMinutes} />

        <SummaryCard
          label="Attendance"
          value={`${summary.attendancePercentage}%`}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">Attendance History</h2>

          <p className="mt-1 text-sm text-gray-500">
            {records.length} attendance records
          </p>
        </div>

        {records.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-gray-500">
              No attendance records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-600">Date</th>

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
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[record.status]
                        }`}
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
        )}
      </div>
    </div>
  );
}
