import { NextResponse } from "next/server";

import { getApiUser, unauthorizedResponse } from "@/lib/api-auth";
import { getDepartments } from "@/services/departmentService";

export async function GET() {
  try {
    // Require authentication.
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

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
