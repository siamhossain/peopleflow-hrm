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

export interface CreateEmployeeInput {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: string;
  joiningDate: string;
}

export interface UpdateEmployeeInput {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  designation?: string;
  departmentId?: string;
  joiningDate?: string;
  resignationDate?: string | null;
  status?: Employee["status"];
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

function toDatabaseStatus(status: Employee["status"]) {
  return status.toUpperCase() as
    | "ACTIVE"
    | "INACTIVE"
    | "ON_LEAVE"
    | "RESIGNED";
}

function toDatabaseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

// Employee listing

export async function getEmployees(): Promise<Employee[]> {
  const employees = await prisma.employee.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return employees.map(mapEmployee);
}

// Retrieve one employee

export async function getEmployeeById(
  employeeId: string,
): Promise<Employee | undefined> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  return employee ? mapEmployee(employee) : undefined;
}

// Create employee without creating a login account

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
    select: { id: true },
  });

  if (!department) {
    throw new Error("Department not found.");
  }

  const employee = await prisma.employee.create({
    data: {
      employeeCode: input.employeeCode,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || null,
      designation: input.designation,
      departmentId: input.departmentId,
      joinDate: toDatabaseDate(input.joiningDate),
      status: "ACTIVE",
    },
  });

  return mapEmployee(employee);
}

// Update employee

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<Employee | undefined> {
  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!existingEmployee) {
    return undefined;
  }

  if (input.departmentId !== undefined) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { id: true },
    });

    if (!department) {
      throw new Error("Department not found.");
    }
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(input.employeeCode !== undefined && {
        employeeCode: input.employeeCode,
      }),
      ...(input.firstName !== undefined && {
        firstName: input.firstName,
      }),
      ...(input.lastName !== undefined && {
        lastName: input.lastName,
      }),
      ...(input.email !== undefined && {
        email: input.email,
      }),
      ...(input.phone !== undefined && {
        phone: input.phone,
      }),
      ...(input.designation !== undefined && {
        designation: input.designation,
      }),
      ...(input.departmentId !== undefined && {
        departmentId: input.departmentId,
      }),
      ...(input.joiningDate !== undefined && {
        joinDate: toDatabaseDate(input.joiningDate),
      }),
      ...(input.resignationDate !== undefined && {
        resignationDate: input.resignationDate
          ? toDatabaseDate(input.resignationDate)
          : null,
      }),
      ...(input.status !== undefined && {
        status: toDatabaseStatus(input.status),
      }),
    },
  });

  return mapEmployee(employee);
}

// Deactivate employee instead of permanently deleting the record

export async function deactivateEmployee(
  employeeId: string,
): Promise<Employee | undefined> {
  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!existingEmployee) {
    return undefined;
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      status: "INACTIVE",
    },
  });

  return mapEmployee(employee);
}

// Employee search, filtering, sorting and pagination

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
    ...(status ? { status: toDatabaseStatus(status) } : {}),
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
