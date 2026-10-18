import { NextResponse } from "next/server";

import { calculateLeaveBalance } from "@/services/leaveService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { message: "Employee ID is required." },
        { status: 400 },
      );
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
