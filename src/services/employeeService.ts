import { prisma } from "@/lib/prisma";
import type { Employee } from "@/types/employee";

export interface EmployeeQuery {
  search?: string;
  departmentId?: string;
  status?: Employee["status"];
  sortBy?: "name" | "joiningDate" | "employeeCode";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaginatedEmployees {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type PrismaEmployee = Awaited<
  ReturnType<typeof prisma.employee.findMany>
>[number];

function mapEmployee(employee: PrismaEmployee): Employee {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    departmentId: employee.departmentId,
    designation: employee.designation,
    joiningDate: employee.joinDate.toISOString().slice(0, 10),
    ...(employee.resignationDate
      ? {
          resignationDate: employee.resignationDate.toISOString().slice(0, 10),
        }
      : {}),
    status: employee.status.toLowerCase() as Employee["status"],
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const employees = await prisma.employee.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return employees.map(mapEmployee);
}

export async function getEmployeeById(
  employeeId: string,
): Promise<Employee | undefined> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  return employee ? mapEmployee(employee) : undefined;
}

export async function queryEmployees(
  query: EmployeeQuery = {},
): Promise<PaginatedEmployees> {
  const {
    search = "",
    departmentId,
    status,
    sortBy = "name",
    sortOrder = "asc",
    page = 1,
    pageSize = 10,
  } = query;

  const normalizedSearch = search.trim();
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 10;
  const requestedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;

  const where = {
    ...(normalizedSearch
      ? {
          OR: [
            {
              firstName: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              employeeCode: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
            {
              designation: {
                contains: normalizedSearch,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status
      ? {
          status: status.toUpperCase() as
            | "ACTIVE"
            | "INACTIVE"
            | "ON_LEAVE"
            | "RESIGNED",
        }
      : {}),
  };

  const orderBy =
    sortBy === "joiningDate"
      ? { joinDate: sortOrder }
      : sortBy === "employeeCode"
        ? { employeeCode: sortOrder }
        : [{ firstName: sortOrder }, { lastName: sortOrder }];

  const total = await prisma.employee.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(requestedPage, totalPages);

  const employees = await prisma.employee.findMany({
    where,
    orderBy,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  });

  return {
    data: employees.map(mapEmployee),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}
