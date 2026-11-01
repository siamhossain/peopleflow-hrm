import { NextRequest, NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";

import {
  deactivateEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/services/employeeService";

interface RouteContext {
  params: Promise<{ id: string }>;
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

function isPrismaError(
  error: unknown,
  code: string,
): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

async function authorizeAdmin() {
  const user = await getApiUser();

  if (!user) {
    return { error: unauthorizedResponse() };
  }

  if (user.role !== "ADMIN") {
    return { error: forbiddenResponse() };
  }

  return { user };
}

// GET /api/employees/[id]
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        { message: "Employee ID is required." },
        { status: 400 },
      );
    }

    const employee = await getEmployeeById(id);

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("Failed to fetch employee:", error);

    return NextResponse.json(
      { message: "Failed to fetch employee." },
      { status: 500 },
    );
  }
}

// PATCH /api/employees/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        { message: "Employee ID is required." },
        { status: 400 },
      );
    }

    const existingEmployee = await getEmployeeById(id);

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 },
      );
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const allowedFields = [
      "employeeCode",
      "firstName",
      "lastName",
      "email",
      "phone",
      "designation",
      "departmentId",
      "joiningDate",
      "status",
    ];

    const providedFields = Object.keys(data);

    if (
      providedFields.length === 0 ||
      providedFields.some((field) => !allowedFields.includes(field))
    ) {
      return NextResponse.json(
        { message: "No valid employee fields provided." },
        { status: 400 },
      );
    }

    const stringFields = [
      "employeeCode",
      "firstName",
      "lastName",
      "email",
      "designation",
      "departmentId",
    ];

    for (const field of stringFields) {
      if (field in data && !isNonEmptyString(data[field])) {
        return NextResponse.json(
          { message: `${field} must be a non-empty string.` },
          { status: 400 },
        );
      }
    }

    if ("email" in data) {
      const email = (data.email as string).trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { message: "Please provide a valid email address." },
          { status: 400 },
        );
      }

      data.email = email;
    }

    if (
      "phone" in data &&
      data.phone !== null &&
      typeof data.phone !== "string"
    ) {
      return NextResponse.json(
        { message: "Phone must be a string or null." },
        { status: 400 },
      );
    }

    if ("joiningDate" in data && !isValidDate(data.joiningDate)) {
      return NextResponse.json(
        { message: "A valid joiningDate is required (YYYY-MM-DD)." },
        { status: 400 },
      );
    }

    const validStatuses = ["active", "inactive", "on_leave", "resigned"];

    if (
      "status" in data &&
      (typeof data.status !== "string" || !validStatuses.includes(data.status))
    ) {
      return NextResponse.json(
        { message: "Invalid employee status." },
        { status: 400 },
      );
    }

    const employee = await updateEmployee(id, data);

    return NextResponse.json({
      message: "Employee updated successfully.",
      data: employee,
    });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Request body contains invalid JSON." },
        { status: 400 },
      );
    }

    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        {
          message:
            "An employee with this email or employee code already exists.",
        },
        { status: 409 },
      );
    }

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("department")
    ) {
      return NextResponse.json(
        { message: "The selected department does not exist." },
        { status: 400 },
      );
    }

    console.error("Failed to update employee:", error);

    return NextResponse.json(
      { message: "Failed to update employee." },
      { status: 500 },
    );
  }
}

// DELETE /api/employees/[id]
// Soft delete: changes status to inactive.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const authorization = await authorizeAdmin();

    if (authorization.error) {
      return authorization.error;
    }

    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        { message: "Employee ID is required." },
        { status: 400 },
      );
    }

    const existingEmployee = await getEmployeeById(id);

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 },
      );
    }

    const employee = await deactivateEmployee(id);

    return NextResponse.json({
      message: "Employee deactivated successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("Failed to deactivate employee:", error);

    return NextResponse.json(
      { message: "Failed to deactivate employee." },
      { status: 500 },
    );
  }
}
