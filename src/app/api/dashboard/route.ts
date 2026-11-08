import { NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import {
  getDashboardStats,
  getLatestAttendanceDate,
  type DashboardStats,
} from "@/services/dashboardService";

const DEMO_DASHBOARD_STATS: DashboardStats = {
  totalEmployees: 24,
  presentToday: 16,
  lateToday: 2,
  halfDayToday: 1,
  absentToday: 2,
  onLeaveToday: 3,
  attendanceRate: 86,
  pendingLeaveRequests: 3,
};

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // Demo viewers receive fictional statistics only.
    // Never query organization-wide database statistics for demo access.
    if (user.role === "DEMO_VIEWER") {
      return NextResponse.json({
        data: {
          date: new Date().toISOString().slice(0, 10),
          stats: DEMO_DASHBOARD_STATS,
        },
      });
    }

    // Preserve existing Admin-only dashboard access.
    if (user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    const date = await getLatestAttendanceDate();
    const stats = await getDashboardStats(date);

    return NextResponse.json({
      data: {
        date,
        stats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard statistics:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics." },
      { status: 500 },
    );
  }
}
