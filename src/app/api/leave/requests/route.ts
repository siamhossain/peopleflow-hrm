import { NextResponse } from "next/server";

import {
  getApiUser,
  forbiddenResponse,
  unauthorizedResponse,
  demoReadOnlyResponse,
} from "@/lib/api-auth";

import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createLeaveRequest,
  getEmployeeLeaveRequests,
  getLeaveRequests,
  rejectLeaveRequest,
} from "@/services/leaveService";

import type { LeaveDuration } from "@/types/leave";

export async function GET(request: Request) {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get("all") === "true";
    const requestedEmployeeId = searchParams.get("employeeId");

    // Admin can view all requests or requests for a selected employee.
    if (user.role === "ADMIN") {
      if (getAll) {
        const requests = await getLeaveRequests();
        return NextResponse.json({ data: requests });
      }

      if (!requestedEmployeeId) {
        return NextResponse.json(
          { message: "Employee ID is required." },
          { status: 400 },
        );
      }

      const requests = await getEmployeeLeaveRequests(requestedEmployeeId);
      return NextResponse.json({ data: requests });
    }

    // Demo Viewer can view all requests in read-only reports,
    // or only Alex Morgan's requests in the My Leave page.
    if (user.role === "DEMO_VIEWER") {
      if (!user.employeeId) {
        return forbiddenResponse();
      }

      const requests = getAll
        ? await getLeaveRequests()
        : await getEmployeeLeaveRequests(user.employeeId);

      return NextResponse.json({ data: requests });
    }

    // Employees can only retrieve their own requests.
    if (user.role === "EMPLOYEE") {
      if (!user.employeeId) {
        return forbiddenResponse();
      }

      const requests = await getEmployeeLeaveRequests(user.employeeId);
      return NextResponse.json({ data: requests });
    }

    return forbiddenResponse();
  } catch (error) {
    console.error("Failed to fetch leave requests:", error);

    return NextResponse.json(
      { message: "Failed to fetch leave requests." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // Demo viewers cannot create leave requests.
    const readOnlyResponse = demoReadOnlyResponse(user);

    if (readOnlyResponse) {
      return readOnlyResponse;
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid leave request payload." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;

    const {
      employeeId: requestedEmployeeId,
      leaveTypeId,
      startDate,
      endDate,
      duration,
      reason,
    } = payload;

    if (
      typeof leaveTypeId !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      typeof reason !== "string" ||
      (duration !== "full_day" && duration !== "half_day")
    ) {
      return NextResponse.json(
        { message: "Please provide all required leave request fields." },
        { status: 400 },
      );
    }

    let employeeId: string;

    if (user.role === "ADMIN") {
      if (
        typeof requestedEmployeeId !== "string" ||
        !requestedEmployeeId.trim()
      ) {
        return NextResponse.json(
          { message: "Employee ID is required." },
          { status: 400 },
        );
      }

      // Admins may submit requests on behalf of employees.
      employeeId = requestedEmployeeId;
    } else {
      if (!user.employeeId) {
        return forbiddenResponse();
      }

      // Never trust an employee ID supplied by the client.
      employeeId = user.employeeId;
    }

    const result = await createLeaveRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      duration: duration as LeaveDuration,
      reason,
    });

    if (!result.success || !result.request) {
      return NextResponse.json(
        { message: result.message || "Unable to create leave request." },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: result.request }, { status: 201 });
  } catch (error) {
    console.error("Failed to create leave request:", error);

    return NextResponse.json(
      { message: "Failed to create leave request." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    // Demo viewers cannot approve, reject, or cancel requests.
    const readOnlyResponse = demoReadOnlyResponse(user);

    if (readOnlyResponse) {
      return readOnlyResponse;
    }

    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid leave action payload." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;
    const { requestId, action } = payload;

    if (
      typeof requestId !== "string" ||
      !requestId.trim() ||
      (action !== "approve" && action !== "reject" && action !== "cancel")
    ) {
      return NextResponse.json(
        { message: "A valid request ID and action are required." },
        { status: 400 },
      );
    }

    if (action === "approve" || action === "reject") {
      if (user.role !== "ADMIN") {
        return forbiddenResponse();
      }

      // Reviewer identity comes from the authenticated admin session.
      const result =
        action === "approve"
          ? await approveLeaveRequest(requestId, user.id)
          : await rejectLeaveRequest(requestId, user.id);

      if (!result.success || !result.request) {
        return NextResponse.json(
          { message: result.message || "Unable to update leave request." },
          { status: 400 },
        );
      }

      return NextResponse.json({ data: result.request });
    }

    // Employees can cancel only their own requests.
    // Admins retain the ability to cancel any approved request.
    if (user.role === "EMPLOYEE" && !user.employeeId) {
      return forbiddenResponse();
    }

    const employeeId = user.role === "EMPLOYEE" ? user.employeeId! : undefined;

    const result = await cancelLeaveRequest(requestId, employeeId);

    if (!result.success || !result.request) {
      return NextResponse.json(
        { message: result.message || "Unable to cancel leave request." },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: result.request });
  } catch (error) {
    console.error("Failed to update leave request:", error);

    return NextResponse.json(
      { message: "Failed to update leave request." },
      { status: 500 },
    );
  }
}
