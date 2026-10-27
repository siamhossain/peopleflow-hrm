import { StatCard } from "@/components/dashboard/StatCard";
import { AttendanceOverview } from "@/components/dashboard/AttendanceOverview";
import { LeaveSummary } from "@/components/dashboard/LeaveSummary";
import { RecentLeaveRequests } from "@/components/dashboard/RecentLeaveRequests";
import {
  getAttendanceOverview,
  getDashboardStats,
  getLatestAttendanceDate,
  getLeaveSummary,
  getRecentLeaveRequests,
} from "@/services/dashboardService";

export default async function DashboardPage() {
  const dashboardDate = await getLatestAttendanceDate();

  const [stats, attendanceOverview, leaveSummary, recentLeaveRequests] =
    await Promise.all([
      getDashboardStats(dashboardDate),
      getAttendanceOverview(dashboardDate),
      getLeaveSummary(),
      getRecentLeaveRequests(5),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Attendance data as of {dashboardDate}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} />
        <StatCard label="Present Today" value={stats.presentToday} />
        <StatCard label="Late Today" value={stats.lateToday} />
        <StatCard label="Absent Today" value={stats.absentToday} />
        <StatCard label="Half Day" value={stats.halfDayToday} />
        <StatCard label="On Leave" value={stats.onLeaveToday} />
        <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} />
        <StatCard label="Pending Leave" value={stats.pendingLeaveRequests} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceOverview
          present={attendanceOverview.present}
          late={attendanceOverview.late}
          halfDay={attendanceOverview.halfDay}
          absent={attendanceOverview.absent}
          onLeave={attendanceOverview.onLeave}
        />

        <LeaveSummary
          pending={leaveSummary.pending}
          approved={leaveSummary.approved}
          rejected={leaveSummary.rejected}
          cancelled={leaveSummary.cancelled}
        />
      </div>

      <RecentLeaveRequests requests={recentLeaveRequests} />
    </div>
  );
}
