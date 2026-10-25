import { prisma } from "@/lib/prisma";

export const getActiveLeaveTypes = async () => {
  return prisma.leaveType.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      defaultDays: true,
      allowHalfDay: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};
