import { NextResponse } from "next/server";

import {
  forbiddenResponse,
  getApiUser,
  unauthorizedResponse,
} from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== "EMPLOYEE" || !user.employeeId) {
      return forbiddenResponse();
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: user.employeeId,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        joinDate: true,
        status: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: employee,
    });
  } catch (error) {
    console.error("Failed to fetch employee profile:", error);

    return NextResponse.json(
      { message: "Failed to fetch employee profile." },
      { status: 500 },
    );
  }
}
