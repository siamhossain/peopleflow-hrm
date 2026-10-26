import { NextResponse } from "next/server";

import { getPaginatedAttendanceList } from "@/services/attendanceService";
import type { AttendanceStatus } from "@/types/attendance";

const attendanceStatuses: AttendanceStatus[] = [
  "present",
  "late",
  "half_day",
  "absent",
  "leave",
  "holiday",
  "weekend",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const requestedStatus = searchParams.get("status");

    const rawPage = searchParams.get("page") ?? "1";
    const rawPageSize = searchParams.get("pageSize") ?? "10";

    const page = Number(rawPage);
    const pageSize = Number(rawPageSize);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return NextResponse.json(
        { error: "Invalid pagination parameters." },
        { status: 400 },
      );
    }

    if (
      requestedStatus &&
      !attendanceStatuses.includes(requestedStatus as AttendanceStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 },
      );
    }

    if (
      (startDate && Number.isNaN(Date.parse(`${startDate}T00:00:00.000Z`))) ||
      (endDate && Number.isNaN(Date.parse(`${endDate}T00:00:00.000Z`)))
    ) {
      return NextResponse.json(
        { error: "Invalid attendance date." },
        { status: 400 },
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date." },
        { status: 400 },
      );
    }

    const result = await getPaginatedAttendanceList(
      {
        employeeId,
        departmentId,
        startDate,
        endDate,
        status: requestedStatus
          ? (requestedStatus as AttendanceStatus)
          : undefined,
      },
      page,
      pageSize,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch attendance records:", error);

    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 },
    );
  }
}
