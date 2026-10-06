import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

import { departments } from "../src/data/departments";
import { employees } from "../src/data/employees";
import { leaveTypes } from "../src/data/leaveTypes";
import { leaveRequests } from "@/data/leaveRequests";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.$transaction(async (tx) => {
    await tx.attendanceRecord.deleteMany();
    await tx.leaveBalance.deleteMany();
    await tx.leaveRequest.deleteMany();
    await tx.user.deleteMany();
    await tx.employee.deleteMany();
    await tx.leaveType.deleteMany();
    await tx.holiday.deleteMany();
    await tx.attendanceSettings.deleteMany();
    await tx.department.deleteMany();

    await tx.department.createMany({
      data: departments.map((department) => ({
        id: department.id,
        name: department.name,
        code: department.code,
      })),
    });

    console.log(`✓ Departments seeded: ${departments.length}`);

    await tx.employee.createMany({
      data: employees.map((employee) => ({
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        designation: employee.designation,
        departmentId: employee.departmentId,
        joinDate: new Date(employee.joiningDate),
        resignationDate: employee.resignationDate
          ? new Date(employee.resignationDate)
          : null,
        status: employee.status.toUpperCase() as
          | "ACTIVE"
          | "INACTIVE"
          | "ON_LEAVE",
      })),
    });

    await tx.leaveType.createMany({
      data: leaveTypes.map((leaveType) => ({
        id: leaveType.id,
        name: leaveType.name,
        code: leaveType.code,
        defaultDays: leaveType.annualAllocation,
        allowHalfDay: leaveType.allowHalfDay,
      })),
    });

    await tx.leaveRequest.createMany({
      data: leaveRequests.map((leaveRequest) => ({
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        startDate: new Date(`${leaveRequest.startDate}T00:00:00`),
        endDate: new Date(`${leaveRequest.endDate}T00:00:00`),
        duration: leaveRequest.duration.toUpperCase() as
          | "FULL_DAY"
          | "HALF_DAY",
        reason: leaveRequest.reason,
        status: leaveRequest.status.toUpperCase() as
          | "PENDING"
          | "APPROVED"
          | "REJECTED"
          | "CANCELLED",
        createdAt: new Date(leaveRequest.createdAt),
        approvedAt: leaveRequest.reviewedAt
          ? new Date(leaveRequest.reviewedAt)
          : null,
        approvedBy: leaveRequest.reviewedBy ?? null,
      })),
    });

    console.log(`✓ Employees seeded: ${employees.length}`);
    console.log(`✓ Leave types seeded: ${leaveTypes.length}`);
    console.log(`✓ Leave requests seeded: ${leaveRequests.length}`);
  });

  console.log("🌱 Database seed completed.");
}

main()
  .catch((error) => {
    console.error("❌ Database seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
