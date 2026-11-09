import {
  CalendarOff,
  Clock,
  Hourglass,
  Percent,
  Sun,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";

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
      {/* Dashboard Heading */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Workforce overview & attendance tracking as of{" "}
            <span className="font-medium text-slate-700">{dashboardDate}</span>
          </p>
        </div>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="indigo"
          description="Active registered staff"
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={UserCheck}
          color="emerald"
          description="Checked in workforce"
        />
        <StatCard
          label="Late Today"
          value={stats.lateToday}
          icon={Clock}
          color="amber"
          description="Arrived past threshold"
        />
        <StatCard
          label="Absent Today"
          value={stats.absentToday}
          icon={UserX}
          color="rose"
          description="Unexcused absence"
        />
        <StatCard
          label="Half Day"
          value={stats.halfDayToday}
          icon={Sun}
          color="sky"
          description="Half day shifts"
        />
        <StatCard
          label="On Leave"
          value={stats.onLeaveToday}
          icon={CalendarOff}
          color="purple"
          description="Approved time off today"
        />
        <StatCard
          label="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={Percent}
          color="emerald"
          description="Today's attendance score"
        />
        <StatCard
          label="Pending Leave"
          value={stats.pendingLeaveRequests}
          icon={Hourglass}
          color="amber"
          description="Requests awaiting review"
        />
      </div>

      {/* Main Grid: Attendance Overview + Leave Summary */}
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

      {/* Recent Leave Requests List */}
      <RecentLeaveRequests requests={recentLeaveRequests} />
    </div>
  );
}
