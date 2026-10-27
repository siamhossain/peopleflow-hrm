import { beforeEach, describe, expect, it, vi } from "vitest";

const { employeeCount, attendanceFindMany, leaveGroupBy } = vi.hoisted(() => ({
  employeeCount: vi.fn(),
  attendanceFindMany: vi.fn(),
  leaveGroupBy: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: {
      count: employeeCount,
    },
    attendanceRecord: {
      findMany: attendanceFindMany,
    },
    leaveRequest: {
      groupBy: leaveGroupBy,
    },
  },
}));

import { getDashboardStats } from "@/services/dashboardService";

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    employeeCount.mockResolvedValue(10);
    attendanceFindMany.mockResolvedValue([
      { status: "PRESENT" },
      { status: "PRESENT" },
      { status: "LATE" },
      { status: "HALF_DAY" },
      { status: "ABSENT" },
      { status: "ON_LEAVE" },
    ]);
    leaveGroupBy.mockResolvedValue([
      { status: "PENDING", _count: { _all: 2 } },
      { status: "APPROVED", _count: { _all: 3 } },
      { status: "REJECTED", _count: { _all: 1 } },
      { status: "CANCELLED", _count: { _all: 0 } },
    ]);
  });

  it("calculates dashboard statistics from attendance data", async () => {
    const stats = await getDashboardStats("2026-08-20");

    expect(stats.totalEmployees).toBe(10);
    expect(stats.presentToday).toBe(2);
    expect(stats.lateToday).toBe(1);
    expect(stats.halfDayToday).toBe(1);
    expect(stats.absentToday).toBe(1);
    expect(stats.onLeaveToday).toBe(1);

    // (2 present + 1 late + 0.5 half-day) / 6 records = 58%
    expect(stats.attendanceRate).toBe(58);
    expect(stats.pendingLeaveRequests).toBe(2);
  });

  it("does not count weekends as working attendance", async () => {
    const stats = await getDashboardStats("2026-08-15");

    expect(stats.totalEmployees).toBe(10);
    expect(stats.presentToday).toBe(0);
    expect(stats.lateToday).toBe(0);
    expect(stats.halfDayToday).toBe(0);
    expect(stats.absentToday).toBe(0);
    expect(stats.onLeaveToday).toBe(0);
    expect(stats.attendanceRate).toBe(0);
    expect(stats.pendingLeaveRequests).toBe(2);
  });

  it("counts only employees active on the requested date", async () => {
    employeeCount.mockResolvedValue(4);

    const stats = await getDashboardStats("2026-06-01");

    expect(stats.totalEmployees).toBe(4);
    expect(employeeCount).toHaveBeenCalledWith({
      where: {
        joinDate: {
          lte: new Date("2026-06-01T23:59:59.999Z"),
        },
        OR: [
          { resignationDate: null },
          {
            resignationDate: {
              gte: new Date("2026-06-01T00:00:00.000Z"),
            },
          },
        ],
      },
    });
  });
});
