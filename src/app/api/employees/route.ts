import { NextRequest, NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import { queryEmployees, type EmployeeQuery } from "@/services/employeeService";
import type { Employee } from "@/types/employee";

const employeeStatuses = [
  "active",
  "inactive",
  "on_leave",
  "resigned",
] as const;

function isEmployeeStatus(value: string): value is Employee["status"] {
  return employeeStatuses.some((status) => status === value);
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the request.
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // 2. Only administrators can access the employee directory.
    if (user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    const params = request.nextUrl.searchParams;

    const rawStatus = params.get("status")?.toLowerCase();
    const status =
      rawStatus && isEmployeeStatus(rawStatus) ? rawStatus : undefined;

    const query: EmployeeQuery = {
      search: params.get("search") ?? "",
      departmentId: params.get("departmentId") || undefined,
      status,
      page: parsePositiveInteger(params.get("page"), 1),
      pageSize: Math.min(parsePositiveInteger(params.get("pageSize"), 10), 100),
    };

    const rawSortBy = params.get("sortBy");

    if (
      rawSortBy === "name" ||
      rawSortBy === "joiningDate" ||
      rawSortBy === "employeeCode"
    ) {
      query.sortBy = rawSortBy;
    }

    const rawSortOrder = params.get("sortOrder");

    if (rawSortOrder === "asc" || rawSortOrder === "desc") {
      query.sortOrder = rawSortOrder;
    }

    if (rawStatus && !status) {
      return NextResponse.json(
        { message: "Invalid employee status." },
        { status: 400 },
      );
    }

    const result = await queryEmployees(query);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to fetch employees:", error);

    return NextResponse.json(
      { message: "Failed to fetch employees." },
      { status: 500 },
    );
  }
}
