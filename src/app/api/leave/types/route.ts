import { NextResponse } from "next/server";
import { getActiveLeaveTypes } from "@/services/leaveTypeService";

export async function GET() {
  try {
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
