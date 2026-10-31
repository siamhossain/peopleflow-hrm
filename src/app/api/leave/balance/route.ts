import { NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import { calculateLeaveBalance } from "@/services/leaveService";

export async function GET(request: Request) {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const requestedEmployeeId = searchParams.get("employeeId");

    let employeeId: string;

    if (user.role === "ADMIN") {
      if (!requestedEmployeeId) {
        return NextResponse.json(
          { message: "Employee ID is required." },
          { status: 400 },
        );
      }

      employeeId = requestedEmployeeId;
    } else {
      if (!user.employeeId) {
        return forbiddenResponse();
      }

      // Ignore any employeeId supplied by an employee.
      employeeId = user.employeeId;
    }

    const balances = await calculateLeaveBalance(employeeId);

    return NextResponse.json({ data: balances });
  } catch (error) {
    console.error("Failed to fetch leave balances:", error);

    return NextResponse.json(
      { message: "Failed to fetch leave balances." },
      { status: 500 },
    );
  }
}
