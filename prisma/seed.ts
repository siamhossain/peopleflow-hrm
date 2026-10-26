import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

import { attendanceRecords } from "../src/data/attendance";
import { departments } from "../src/data/departments";
import { employees } from "../src/data/employees";
import { leaveRequests } from "../src/data/leaveRequests";
import { leaveTypes } from "../src/data/leaveTypes";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const attendanceStatusMap = {
  present: "PRESENT",
  absent: "ABSENT",
  late: "LATE",
  half_day: "HALF_DAY",
  leave: "ON_LEAVE",
  holiday: "HOLIDAY",
  weekend: "WEEKEND",
} as const;

const toDateTime = (date: string, time?: string): Date | null => {
  if (!time) {
    return null;
  }

  return new Date(`${date}T${time}:00`);
};

async function main() {
  console.log("Starting database seed...");

  await prisma.$transaction(async (tx) => {
    // WARNING: This resets the existing seeded HRM data.
    // Do not run against data you need to preserve.
    await tx.attendanceRecord.deleteMany();
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

    console.log(`Departments seeded: ${departments.length}`);

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
          | "ON_LEAVE"
          | "RESIGNED",
      })),
    });

    console.log(`Employees seeded: ${employees.length}`);

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

    console.log(`Leave types seeded: ${leaveTypes.length}`);
    console.log(`Leave requests seeded: ${leaveRequests.length}`);

    await tx.attendanceRecord.createMany({
      data: attendanceRecords.map((record) => ({
        id: record.id,
        employeeId: record.employeeId,
        date: new Date(`${record.date}T00:00:00`),
        status: attendanceStatusMap[record.status],
        checkIn: toDateTime(record.date, record.checkIn),
        checkOut: toDateTime(record.date, record.checkOut),
        workHours:
          record.workingMinutes === undefined
            ? null
            : record.workingMinutes / 60,
      })),
    });

    console.log(`Attendance records seeded: ${attendanceRecords.length}`);
  });

  console.log("Database seed completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
