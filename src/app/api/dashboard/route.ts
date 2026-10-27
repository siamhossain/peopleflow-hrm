import { NextResponse } from "next/server";
import {
  getDashboardStats,
  getLatestAttendanceDate,
} from "@/services/dashboardService";

export async function GET() {
  try {
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
