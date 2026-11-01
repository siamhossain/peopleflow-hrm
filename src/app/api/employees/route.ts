import { NextRequest, NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import {
  createEmployee,
  queryEmployees,
  type CreateEmployeeInput,
  type EmployeeQuery,
} from "@/services/employeeService";
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

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request.
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // 2. Only administrators can create employees.
    if (user.role !== "ADMIN") {
      return forbiddenResponse();
    }

    // 3. Parse and validate the request body.
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const requiredFields = [
      "employeeCode",
      "firstName",
      "lastName",
      "email",
      "designation",
      "departmentId",
    ] as const;

    for (const field of requiredFields) {
      if (!isNonEmptyString(data[field])) {
        return NextResponse.json(
          { message: `${field} is required.` },
          { status: 400 },
        );
      }
    }

    if (!isValidDate(data.joiningDate)) {
      return NextResponse.json(
        {
          message: "A valid joining date is required (YYYY-MM-DD).",
        },
        { status: 400 },
      );
    }

    const email = (data.email as string).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (
      data.phone !== undefined &&
      data.phone !== null &&
      typeof data.phone !== "string"
    ) {
      return NextResponse.json(
        { message: "Phone must be a string." },
        { status: 400 },
      );
    }

    // 4. Prepare the service input.
    const input: CreateEmployeeInput = {
      employeeCode: (data.employeeCode as string).trim(),
      firstName: (data.firstName as string).trim(),
      lastName: (data.lastName as string).trim(),
      email,
      designation: (data.designation as string).trim(),
      departmentId: (data.departmentId as string).trim(),
      joiningDate: data.joiningDate,
      ...(typeof data.phone === "string" && data.phone.trim()
        ? { phone: data.phone.trim() }
        : {}),
    };

    // 5. Create the employee.
    const employee = await createEmployee(input);

    return NextResponse.json(
      {
        message: "Employee created successfully.",
        data: employee,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    // Invalid JSON body.
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Request body contains invalid JSON." },
        { status: 400 },
      );
    }

    // Duplicate email or employee code.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "An employee with this email or employee code already exists.",
        },
        { status: 409 },
      );
    }

    // Invalid department.
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("department")
    ) {
      return NextResponse.json(
        { message: "The selected department does not exist." },
        { status: 400 },
      );
    }

    console.error("Failed to create employee:", error);

    return NextResponse.json(
      { message: "Failed to create employee." },
      { status: 500 },
    );
  }
}
