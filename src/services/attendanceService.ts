import { prisma } from "@/lib/prisma";
import type { AttendanceRecord } from "@/types/attendance";
import type { AttendanceStatus } from "@/types/attendance";

export interface AttendanceQuery {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

export interface AttendanceSummary {
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
  totalLateMinutes: number;
}

export interface AttendanceListItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingMinutes?: number;
  lateMinutes?: number;
}

export interface PaginatedAttendance {
  data: AttendanceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusToDatabase = {
  present: "PRESENT",
  late: "LATE",
  half_day: "HALF_DAY",
  absent: "ABSENT",
  leave: "ON_LEAVE",
  holiday: "HOLIDAY",
  weekend: "WEEKEND",
} as const;

const statusFromDatabase: Record<string, AttendanceStatus> = {
  PRESENT: "present",
  LATE: "late",
  HALF_DAY: "half_day",
  ABSENT: "absent",
  ON_LEAVE: "leave",
  HOLIDAY: "holiday",
  WEEKEND: "weekend",
};

const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

const toTimeString = (date?: Date | null): string | undefined =>
  date
    ? `${String(date.getUTCHours()).padStart(2, "0")}:${String(
        date.getUTCMinutes(),
      ).padStart(2, "0")}`
    : undefined;

const toMinutes = (time?: string | null): number | undefined => {
  if (!time) return undefined;

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return undefined;
  }

  return hours * 60 + minutes;
};

const calculateLateMinutes = (
  checkIn?: Date | null,
  workStartTime?: string,
  gracePeriod = 0,
): number | undefined => {
  if (!checkIn || !workStartTime) return undefined;

  const actualMinutes = checkIn.getUTCHours() * 60 + checkIn.getUTCMinutes();
  const scheduledMinutes = toMinutes(workStartTime);

  if (scheduledMinutes === undefined) return undefined;

  return Math.max(0, actualMinutes - scheduledMinutes - gracePeriod);
};

const mapAttendance = (
  record: {
    id: string;
    employeeId: string;
    date: Date;
    status: string;
    checkIn: Date | null;
    checkOut: Date | null;
    workHours: number | null;
  },
  workStartTime?: string,
  gracePeriod = 0,
): AttendanceRecord => {
  const checkIn = toTimeString(record.checkIn);
  const checkOut = toTimeString(record.checkOut);

  const workingMinutes =
    record.workHours == null ? undefined : Math.round(record.workHours * 60);

  const lateMinutes =
    record.status === "LATE"
      ? calculateLateMinutes(record.checkIn, workStartTime, gracePeriod)
      : record.status === "PRESENT"
        ? 0
        : undefined;

  return {
    id: record.id,
    employeeId: record.employeeId,
    date: toDateString(record.date),
    status: statusFromDatabase[record.status],
    ...(checkIn ? { checkIn } : {}),
    ...(checkOut ? { checkOut } : {}),
    ...(workingMinutes !== undefined ? { workingMinutes } : {}),
    ...(lateMinutes !== undefined ? { lateMinutes } : {}),
  };
};

const getSettings = async () => {
  return prisma.attendanceSettings.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

const buildDateFilter = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return undefined;

  const endExclusive = endDate
    ? new Date(`${endDate}T00:00:00.000Z`)
    : undefined;

  if (endExclusive) {
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  }

  return {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
    ...(endExclusive ? { lt: endExclusive } : {}),
  };
};

const buildWhere = (query: AttendanceQuery) => {
  const dateFilter = buildDateFilter(query.startDate, query.endDate);

  return {
    ...(query.employeeId ? { employeeId: query.employeeId } : {}),
    ...(query.departmentId
      ? { employee: { departmentId: query.departmentId } }
      : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(query.status ? { status: statusToDatabase[query.status] } : {}),
  };
};

const mapListItem = (
  record: {
    id: string;
    employeeId: string;
    date: Date;
    status: string;
    checkIn: Date | null;
    checkOut: Date | null;
    workHours: number | null;
    employee: {
      firstName: string;
      lastName: string;
      department: { name: string };
    };
  },
  workStartTime?: string,
  gracePeriod = 0,
): AttendanceListItem => {
  const attendance = mapAttendance(record, workStartTime, gracePeriod);

  return {
    ...attendance,
    employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
    department: record.employee.department.name,
  };
};

export async function getAttendance(
  query: AttendanceQuery = {},
): Promise<AttendanceRecord[]> {
  const [records, settings] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: buildWhere(query),
      include: {
        employee: {
          select: {
            joinDate: true,
            resignationDate: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { employeeId: "asc" }],
    }),
    getSettings(),
  ]);

  return records
    .filter((record) => {
      const date = toDateString(record.date);
      const joinDate = toDateString(record.employee.joinDate);
      const resignationDate = record.employee.resignationDate
        ? toDateString(record.employee.resignationDate)
        : undefined;

      return date >= joinDate && (!resignationDate || date <= resignationDate);
    })
    .map((record) =>
      mapAttendance(
        record,
        settings?.workStartTime,
        settings?.gracePeriod ?? 0,
      ),
    );
}

export async function getAttendanceList(
  query: AttendanceQuery = {},
): Promise<AttendanceListItem[]> {
  const [records, settings] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: buildWhere(query),
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            joinDate: true,
            resignationDate: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: "desc" }, { employeeId: "asc" }],
    }),
    getSettings(),
  ]);

  return records
    .filter((record) => {
      const date = toDateString(record.date);
      const joinDate = toDateString(record.employee.joinDate);
      const resignationDate = record.employee.resignationDate
        ? toDateString(record.employee.resignationDate)
        : undefined;

      return date >= joinDate && (!resignationDate || date <= resignationDate);
    })
    .map((record) =>
      mapListItem(record, settings?.workStartTime, settings?.gracePeriod ?? 0),
    );
}

export async function getPaginatedAttendanceList(
  query: AttendanceQuery = {},
  page = 1,
  pageSize = 25,
): Promise<PaginatedAttendance> {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

  // Apply all attendance filters and employee eligibility rules first.
  const records = await getAttendanceList(query);

  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    data: records.slice(startIndex, startIndex + safePageSize),
    total,
    page: currentPage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function getAttendanceByDate(
  date: string,
): Promise<AttendanceListItem[]> {
  return getAttendanceList({
    startDate: date,
    endDate: date,
  });
}

export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceRecord[]> {
  return getAttendance({
    employeeId,
    startDate,
    endDate,
  });
}

export async function calculateAttendanceSummary(
  employeeId: string,
  startDate?: string,
  endDate?: string,
): Promise<AttendanceSummary> {
  const records = await getEmployeeAttendance(employeeId, startDate, endDate);

  const workingRecords = records.filter(
    (record) => record.status !== "holiday" && record.status !== "weekend",
  );

  const presentDays = workingRecords.filter(
    (record) => record.status === "present",
  ).length;

  const lateDays = workingRecords.filter(
    (record) => record.status === "late",
  ).length;

  const halfDays = workingRecords.filter(
    (record) => record.status === "half_day",
  ).length;

  const absentDays = workingRecords.filter(
    (record) => record.status === "absent",
  ).length;

  const leaveDays = workingRecords.filter(
    (record) => record.status === "leave",
  ).length;

  const totalLateMinutes = workingRecords.reduce(
    (total, record) => total + (record.lateMinutes ?? 0),
    0,
  );

  const totalWorkingDays = workingRecords.length;

  const attendanceDays = presentDays + lateDays + halfDays * 0.5;

  const attendancePercentage =
    totalWorkingDays === 0
      ? 0
      : Number(((attendanceDays / totalWorkingDays) * 100).toFixed(2));

  return {
    totalWorkingDays,
    presentDays,
    lateDays,
    halfDays,
    absentDays,
    leaveDays,
    attendancePercentage,
    totalLateMinutes,
  };
}
