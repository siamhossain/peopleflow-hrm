import { prisma } from "@/lib/prisma";
import type { Department } from "@/types/employee";

export async function getDepartments(): Promise<Department[]> {
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return departments;
}

export async function getDepartmentById(
  departmentId: string,
): Promise<Department | null> {
  return prisma.department.findUnique({
    where: {
      id: departmentId,
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
}
