import { NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
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
    // 1. Authenticate the request.
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // 2. Employees must have an associated employee record.
    if (user.role === "EMPLOYEE" && !user.employeeId) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);

    // 3. Read and validate pagination.
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "25");

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

    // 4. Validate attendance status.
    const requestedStatus = searchParams.get("status");

    if (
      requestedStatus &&
      !attendanceStatuses.includes(requestedStatus as AttendanceStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 },
      );
    }

    // 5. Read and validate date filters.
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

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

    // 6. Build a role-restricted query.
    const isAdmin = user.role === "ADMIN";

    const employeeId = isAdmin
      ? searchParams.get("employeeId") || undefined
      : user.employeeId!;

    const departmentId = isAdmin
      ? searchParams.get("departmentId") || undefined
      : undefined;

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
