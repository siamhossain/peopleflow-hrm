import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.",
    );
  }

  if (password.length < 12) {
    throw new Error(
      "The administrator password must be at least 12 characters.",
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (existingAdmin) {
    throw new Error(
      "An administrator already exists. Refusing to create another initial administrator.",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error(
      "An account with this email already exists. No changes were made.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      employeeId: null,
    },
  });

  console.log(`Administrator account created for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error(
      "Administrator setup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
