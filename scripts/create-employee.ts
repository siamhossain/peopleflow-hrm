import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.EMPLOYEE_EMAIL?.trim().toLowerCase();
  const password = process.env.EMPLOYEE_PASSWORD;

  const employeeCode = process.env.EMPLOYEE_CODE?.trim().toUpperCase();
  const firstName = process.env.EMPLOYEE_FIRST_NAME?.trim();
  const lastName = process.env.EMPLOYEE_LAST_NAME?.trim();
  const designation = process.env.EMPLOYEE_DESIGNATION?.trim();
  const departmentCode =
    process.env.EMPLOYEE_DEPARTMENT_CODE?.trim().toUpperCase();
  const joinDateValue = process.env.EMPLOYEE_JOIN_DATE?.trim();
  const phone = process.env.EMPLOYEE_PHONE?.trim();

  if (
    !email ||
    !password ||
    !employeeCode ||
    !firstName ||
    !lastName ||
    !designation ||
    !departmentCode ||
    !joinDateValue
  ) {
    throw new Error(
      "Set all required EMPLOYEE_* environment variables before running this script.",
    );
  }

  if (password.length < 12) {
    throw new Error("The employee password must be at least 12 characters.");
  }

  const joinDate = new Date(joinDateValue);

  if (Number.isNaN(joinDate.getTime())) {
    throw new Error("EMPLOYEE_JOIN_DATE must be a valid date.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new Error(
        "An account with this email already exists. No changes were made.",
      );
    }

    const existingEmployee = await tx.employee.findFirst({
      where: {
        OR: [{ email }, { employeeCode }],
      },
      select: { id: true },
    });

    if (existingEmployee) {
      throw new Error(
        "An employee with this email or employee code already exists. No changes were made.",
      );
    }

    const department = await tx.department.findUnique({
      where: { code: departmentCode },
      select: { id: true },
    });

    if (!department) {
      throw new Error(
        `Department with code "${departmentCode}" was not found.`,
      );
    }

    const employee = await tx.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone: phone || null,
        designation,
        departmentId: department.id,
        joinDate,
        status: "ACTIVE",
      },
      select: {
        id: true,
        employeeCode: true,
        email: true,
      },
    });

    await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "EMPLOYEE",
        employeeId: employee.id,
      },
    });

    console.log("Employee account created successfully.");
    console.log(`Employee ID: ${employee.employeeCode}`);
    console.log(`Email: ${employee.email}`);
  });
}

main()
  .catch((error: unknown) => {
    console.error(
      "Employee account setup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
