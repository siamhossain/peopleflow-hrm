import { prisma } from "@/lib/prisma";
import type { LeaveRequest } from "@/types/leave";

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  halfDayToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  pendingLeaveRequests: number;
}

export interface AttendanceOverview {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  onLeave: number;
}

export interface LeaveSummary {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

/**
 * The organization's working days are Sunday through Thursday.
 * JavaScript UTC weekday values: Sunday = 0, Thursday = 4.
 */
const WORKING_DAYS = [0, 1, 2, 3, 4];

const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const isWorkingDay = (date: string): boolean => {
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();

  return WORKING_DAYS.includes(dayOfWeek);
};

const mapLeaveRequest = (request: {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  reason: string;
  status: string;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: string | null;
}): LeaveRequest => ({
  id: request.id,
  employeeId: request.employeeId,
  leaveTypeId: request.leaveTypeId,
  startDate: formatDateOnly(request.startDate),
  endDate: formatDateOnly(request.endDate),
  duration: request.duration.toLowerCase() as "full_day" | "half_day",
  reason: request.reason,
  status: request.status.toLowerCase() as
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled",
  createdAt: request.createdAt.toISOString(),
  reviewedAt: request.approvedAt?.toISOString(),
  reviewedBy: request.approvedBy ?? undefined,
});

const buildAttendanceWhere = (date: string) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    date: {
      gte: start,
      lt: end,
    },
    employee: {
      joinDate: {
        lt: end,
      },
      OR: [{ resignationDate: null }, { resignationDate: { gte: start } }],
    },
  };
};

export const getLatestAttendanceDate = async (): Promise<string> => {
  const latest = await prisma.attendanceRecord.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  return latest ? formatDateOnly(latest.date) : formatDateOnly(new Date());
};

export const getAttendanceOverview = async (
  date: string,
): Promise<AttendanceOverview> => {
  const records = await prisma.attendanceRecord.findMany({
    where: buildAttendanceWhere(date),
    select: { status: true },
  });

  return {
    present: records.filter((r) => r.status === "PRESENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    halfDay: records.filter((r) => r.status === "HALF_DAY").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    onLeave: records.filter((r) => r.status === "ON_LEAVE").length,
  };
};

export const getLeaveSummary = async (): Promise<LeaveSummary> => {
  const counts = await prisma.leaveRequest.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countFor = (status: string): number =>
    counts.find((item) => item.status === status)?._count._all ?? 0;

  return {
    pending: countFor("PENDING"),
    approved: countFor("APPROVED"),
    rejected: countFor("REJECTED"),
    cancelled: countFor("CANCELLED"),
  };
};

export const getRecentLeaveRequests = async (
  limit = 5,
): Promise<LeaveRequest[]> => {
  const requests = await prisma.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.floor(limit)),
  });

  return requests.map(mapLeaveRequest);
};

export const getDashboardStats = async (
  date: string,
): Promise<DashboardStats> => {
  const [totalEmployees, attendanceRecords, leaveSummary] = await Promise.all([
    prisma.employee.count({
      where: {
        joinDate: {
          lte: new Date(`${date}T23:59:59.999Z`),
        },
        OR: [
          { resignationDate: null },
          {
            resignationDate: {
              gte: new Date(`${date}T00:00:00.000Z`),
            },
          },
        ],
      },
    }),

    prisma.attendanceRecord.findMany({
      where: buildAttendanceWhere(date),
      select: { status: true },
    }),

    getLeaveSummary(),
  ]);

  // Do not count attendance on weekends.
  // Preserve employee totals and pending leave request counts.
  if (!isWorkingDay(date)) {
    return {
      totalEmployees,
      presentToday: 0,
      lateToday: 0,
      halfDayToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      attendanceRate: 0,
      pendingLeaveRequests: leaveSummary.pending,
    };
  }

  const presentToday = attendanceRecords.filter(
    (r) => r.status === "PRESENT",
  ).length;

  const lateToday = attendanceRecords.filter((r) => r.status === "LATE").length;

  const halfDayToday = attendanceRecords.filter(
    (r) => r.status === "HALF_DAY",
  ).length;

  const absentToday = attendanceRecords.filter(
    (r) => r.status === "ABSENT",
  ).length;

  const onLeaveToday = attendanceRecords.filter(
    (r) => r.status === "ON_LEAVE",
  ).length;

  // Exclude holiday and weekend records from the attendance-rate denominator.
  const workingRecords = attendanceRecords.filter(
    (r) => r.status !== "HOLIDAY" && r.status !== "WEEKEND",
  );

  const attendanceRate =
    workingRecords.length > 0
      ? Math.round(
          ((presentToday + lateToday + halfDayToday * 0.5) /
            workingRecords.length) *
            100,
        )
      : 0;

  return {
    totalEmployees,
    presentToday,
    lateToday,
    halfDayToday,
    absentToday,
    onLeaveToday,
    attendanceRate,
    pendingLeaveRequests: leaveSummary.pending,
  };
};
