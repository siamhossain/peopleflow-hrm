import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set DEMO_EMAIL and DEMO_PASSWORD before running this script.",
    );
  }

  if (password.length < 16) {
    throw new Error("DEMO_PASSWORD must be at least 16 characters.");
  }

  const employeeCode = "DEMO-001";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error("Demo email already exists. No changes were made.");
    }

    const existingEmployee = await tx.employee.findFirst({
      where: {
        OR: [{ email }, { employeeCode }],
      },
      select: { id: true },
    });

    if (existingEmployee) {
      throw new Error("Demo employee already exists. No changes were made.");
    }

    const department = await tx.department.findUnique({
      where: { code: "ENG" },
      select: { id: true },
    });

    if (!department) {
      throw new Error("Engineering department was not found.");
    }

    const employee = await tx.employee.create({
      data: {
        employeeCode,
        firstName: "Alex",
        lastName: "Morgan",
        email,
        designation: "Software Engineer",
        departmentId: department.id,
        joinDate: new Date("2025-01-01"),
        status: "ACTIVE",
      },
      select: {
        id: true,
        employeeCode: true,
      },
    });

    await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "DEMO_VIEWER",
        employeeId: employee.id,
      },
    });

    console.log("Demo account created successfully.");
    console.log(`Employee code: ${employee.employeeCode}`);
    console.log(`Email: ${email}`);
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Demo account setup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
