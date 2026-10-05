import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

import { departments } from "../src/data/departments";
import { employees } from "../src/data/employees";
import { leaveTypes } from "../src/data/leaveTypes";

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

    console.log(`✓ Employees seeded: ${employees.length}`);
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

  