import { NextResponse } from "next/server";

import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";
import { getActiveLeaveTypes } from "@/services/leaveTypeService";

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const leaveTypes = await getActiveLeaveTypes();

    return NextResponse.json({
      data: leaveTypes,
    });
  } catch (error) {
    console.error("Failed to fetch leave types:", error);

    return NextResponse.json(
      { message: "Failed to fetch leave types." },
      { status: 500 },
    );
  }
}
