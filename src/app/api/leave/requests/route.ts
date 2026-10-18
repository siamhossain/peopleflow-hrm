import { NextResponse } from "next/server";
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
    const { searchParams } = new URL(request.url);

    if (searchParams.get("all") === "true") {
      const requests = await getLeaveRequests();
      return NextResponse.json({ data: requests });
    }

    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { message: "Employee ID is required." },
        { status: 400 },
      );
    }

    const requests = await getEmployeeLeaveRequests(employeeId);
    return NextResponse.json({ data: requests });
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
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid leave request payload." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;
    const { employeeId, leaveTypeId, startDate, endDate, duration, reason } =
      payload;

    if (
      typeof employeeId !== "string" ||
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
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid leave action payload." },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;
    const { requestId, action, reviewerId } = payload;

    if (
      typeof requestId !== "string" ||
      (action !== "approve" && action !== "reject" && action !== "cancel")
    ) {
      return NextResponse.json(
        { message: "A valid request ID and action are required." },
        { status: 400 },
      );
    }

    if (
      (action === "approve" || action === "reject") &&
      typeof reviewerId !== "string"
    ) {
      return NextResponse.json(
        { message: "Reviewer ID is required for this action." },
        { status: 400 },
      );
    }

    const result =
      action === "approve"
        ? await approveLeaveRequest(requestId, reviewerId as string)
        : action === "reject"
          ? await rejectLeaveRequest(requestId, reviewerId as string)
          : await cancelLeaveRequest(requestId);

    if (!result.success || !result.request) {
      return NextResponse.json(
        { message: result.message || "Unable to update leave request." },
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
