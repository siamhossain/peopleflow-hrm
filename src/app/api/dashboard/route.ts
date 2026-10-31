import { NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import {
  getDashboardStats,
  getLatestAttendanceDate,
} from "@/services/dashboardService";

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

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
