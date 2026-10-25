import { NextResponse } from "next/server";

import { getDepartments } from "@/services/departmentService";

export async function GET() {
  try {
    const departments = await getDepartments();

    return NextResponse.json({
      data: departments,
    });
  } catch (error) {
    console.error("Failed to fetch departments:", error);

    return NextResponse.json(
      { message: "Failed to fetch departments." },
      { status: 500 },
    );
  }
}
