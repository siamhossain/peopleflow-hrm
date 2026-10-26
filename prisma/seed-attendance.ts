import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

import { attendanceRecords } from "../src/data/attendance";

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

function toDateTime(date: string, time?: string): Date | null {
  if (!time) {
    return null;
  }

  return new Date(`${date}T${time}:00`);
}

async function main() {
  console.log("Starting attendance-only seed...");

  // Verify that every mock employee exists before inserting attendance.
  const employeeIds = [
    ...new Set(attendanceRecords.map((record) => record.employeeId)),
  ];

  const existingEmployees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true },
  });

  const existingEmployeeIds = new Set(
    existingEmployees.map((employee) => employee.id),
  );

  const missingEmployeeIds = employeeIds.filter(
    (id) => !existingEmployeeIds.has(id),
  );

  if (missingEmployeeIds.length > 0) {
    throw new Error(
      `Cannot seed attendance. Missing employee IDs: ${missingEmployeeIds.join(", ")}`,
    );
  }

  const result = await prisma.attendanceRecord.createMany({
    data: attendanceRecords.map((record) => ({
      id: record.id,
      employeeId: record.employeeId,
      date: new Date(`${record.date}T00:00:00`),
      status: attendanceStatusMap[record.status],
      checkIn: toDateTime(record.date, record.checkIn),
      checkOut: toDateTime(record.date, record.checkOut),
      workHours:
        record.workingMinutes === undefined ? null : record.workingMinutes / 60,
    })),
    skipDuplicates: true,
  });

  console.log(`Attendance records inserted: ${result.count}`);
  console.log("Attendance-only seed completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Attendance seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
