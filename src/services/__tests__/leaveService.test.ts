import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  employeeFindUnique: vi.fn(),
  leaveTypeFindUnique: vi.fn(),
  leaveTypeFindMany: vi.fn(),
  leaveRequestFindMany: vi.fn(),
  leaveRequestCreate: vi.fn(),
  leaveRequestFindUnique: vi.fn(),
  leaveRequestFindFirst: vi.fn(),
  leaveRequestUpdate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: {
      findUnique: mocks.employeeFindUnique,
    },
    leaveType: {
      findUnique: mocks.leaveTypeFindUnique,
      findMany: mocks.leaveTypeFindMany,
    },
    leaveRequest: {
      findMany: mocks.leaveRequestFindMany,
      create: mocks.leaveRequestCreate,
      findUnique: mocks.leaveRequestFindUnique,
      findFirst: mocks.leaveRequestFindFirst,
      update: mocks.leaveRequestUpdate,
    },
  },
}));

import {
  approveLeaveRequest,
  calculateLeaveBalance,
  cancelLeaveRequest,
  createLeaveRequest,
  rejectLeaveRequest,
  validateLeaveRequest,
} from "@/services/leaveService";

const employee = {
  id: "emp-001",
  joinDate: new Date("2020-01-01T00:00:00.000Z"),
  resignationDate: null,
};

const annualLeave = {
  id: "leave-annual",
  name: "Annual Leave",
  defaultDays: 20,
  isActive: true,
};

const sickLeave = {
  id: "leave-sick",
  name: "Sick Leave",
  defaultDays: 10,
  isActive: true,
};

const request = (overrides: Record<string, unknown> = {}) => ({
  id: "request-001",
  employeeId: "emp-001",
  leaveTypeId: "leave-annual",
  startDate: new Date("2026-08-10T00:00:00.000Z"),
  endDate: new Date("2026-08-11T00:00:00.000Z"),
  duration: "FULL_DAY",
  reason: "Personal travel",
  status: "APPROVED",
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  approvedAt: new Date("2026-08-02T00:00:00.000Z"),
  approvedBy: "reviewer-001",
  ...overrides,
});

const validInput = {
  employeeId: "emp-001",
  leaveTypeId: "leave-annual",
  startDate: "2026-08-25",
  endDate: "2026-08-26",
  duration: "full_day" as const,
  reason: "Personal travel",
};

beforeEach(() => {
  vi.resetAllMocks();

  mocks.employeeFindUnique.mockResolvedValue(employee);

  mocks.leaveTypeFindUnique.mockImplementation(async ({ where }) => {
    if (where.id === annualLeave.id) return annualLeave;
    if (where.id === sickLeave.id) return sickLeave;
    return null;
  });

  mocks.leaveTypeFindMany.mockResolvedValue([annualLeave, sickLeave]);
  mocks.leaveRequestFindMany.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Leave Service — Business Rules", () => {
  describe("calculateLeaveBalance", () => {
    it("calculates used and remaining annual leave", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          startDate: new Date("2026-08-10T00:00:00.000Z"),
          endDate: new Date("2026-08-11T00:00:00.000Z"),
        }),
      ]);

      const balance = await calculateLeaveBalance("emp-001");
      const annual = balance.find(
        (item) => item.leaveTypeId === "leave-annual",
      );

      expect(annual).toMatchObject({
        allocatedDays: 20,
        usedDays: 2,
        pendingDays: 0,
        remainingDays: 18,
      });
    });

    it("counts two approved half-days as one full day", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          leaveTypeId: "leave-sick",
          duration: "HALF_DAY",
          startDate: new Date("2026-08-10T00:00:00.000Z"),
          endDate: new Date("2026-08-10T00:00:00.000Z"),
        }),
        request({
          id: "request-002",
          leaveTypeId: "leave-sick",
          duration: "HALF_DAY",
          startDate: new Date("2026-08-11T00:00:00.000Z"),
          endDate: new Date("2026-08-11T00:00:00.000Z"),
        }),
      ]);

      const balance = await calculateLeaveBalance("emp-001");
      const sick = balance.find((item) => item.leaveTypeId === "leave-sick");

      expect(sick?.usedDays).toBe(1);
    });

    it("counts pending leave separately from used leave", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          status: "PENDING",
          startDate: new Date("2026-08-10T00:00:00.000Z"),
          endDate: new Date("2026-08-11T00:00:00.000Z"),
        }),
      ]);

      const balance = await calculateLeaveBalance("emp-001");
      const annual = balance.find(
        (item) => item.leaveTypeId === "leave-annual",
      );

      expect(annual?.usedDays).toBe(0);
      expect(annual?.pendingDays).toBe(2);
    });
  });

  describe("validateLeaveRequest", () => {
    it("rejects a start date after the end date", async () => {
      const error = await validateLeaveRequest({
        ...validInput,
        startDate: "2026-08-27",
        endDate: "2026-08-26",
      });

      expect(error).toBe("Start date cannot be after end date.");
    });

    it("requires a leave reason", async () => {
      const error = await validateLeaveRequest({
        ...validInput,
        reason: "   ",
      });

      expect(error).toBe("Leave reason is required.");
    });

    it("rejects half-day leave spanning multiple dates", async () => {
      const error = await validateLeaveRequest({
        ...validInput,
        duration: "half_day",
      });

      expect(error).toBe(
        "Half-day leave must use the same start and end date.",
      );
    });

    it("rejects an unknown employee", async () => {
      mocks.employeeFindUnique.mockResolvedValue(null);

      const error = await validateLeaveRequest(validInput);

      expect(error).toBe("Employee not found.");
    });

    it("rejects an unknown leave type", async () => {
      mocks.leaveTypeFindUnique.mockResolvedValue(null);

      const error = await validateLeaveRequest(validInput);

      expect(error).toBe("Leave type not found.");
    });

    it("rejects leave before the employee joining date", async () => {
      mocks.employeeFindUnique.mockResolvedValue({
        ...employee,
        joinDate: new Date("2026-09-01T00:00:00.000Z"),
      });

      const error = await validateLeaveRequest(validInput);

      expect(error).toBe(
        "Leave cannot start before the employee joining date.",
      );
    });

    it("rejects overlapping active requests", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          startDate: new Date("2026-08-25T00:00:00.000Z"),
          endDate: new Date("2026-08-26T00:00:00.000Z"),
        }),
      ]);

      const error = await validateLeaveRequest(validInput);

      expect(error).toBe(
        "Leave request overlaps with an existing leave request.",
      );
    });

    it("allows overlapping dates when the previous request was rejected", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          status: "REJECTED",
          startDate: new Date("2026-08-25T00:00:00.000Z"),
          endDate: new Date("2026-08-26T00:00:00.000Z"),
        }),
      ]);

      const error = await validateLeaveRequest(validInput);

      expect(error).toBeNull();
    });

    it("rejects requests exceeding the available balance", async () => {
      mocks.leaveRequestFindMany.mockResolvedValue([
        request({
          status: "APPROVED",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-01-15T00:00:00.000Z"),
        }),
      ]);

      const error = await validateLeaveRequest({
        ...validInput,
        startDate: "2026-08-25",
        endDate: "2026-08-30",
      });

      expect(error).toBe(
        "Requested leave exceeds the available leave balance.",
      );
    });
  });

  describe("createLeaveRequest", () => {
    it("creates a valid request with pending status", async () => {
      mocks.leaveRequestCreate.mockResolvedValue(
        request({
          id: "request-new",
          status: "PENDING",
          startDate: new Date("2026-08-25T00:00:00.000Z"),
          endDate: new Date("2026-08-26T00:00:00.000Z"),
          approvedAt: null,
          approvedBy: null,
        }),
      );

      const result = await createLeaveRequest(validInput);

      expect(result.success).toBe(true);
      expect(result.request?.status).toBe("pending");
      expect(result.request?.employeeId).toBe("emp-001");

      expect(mocks.leaveRequestCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "PENDING",
            reason: "Personal travel",
          }),
        }),
      );
    });

    it("does not create a request when validation fails", async () => {
      const result = await createLeaveRequest({
        ...validInput,
        reason: " ",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Leave reason is required.");
      expect(mocks.leaveRequestCreate).not.toHaveBeenCalled();
    });
  });

  describe("approveLeaveRequest", () => {
    it("approves a pending request", async () => {
      mocks.leaveRequestFindUnique.mockResolvedValue(
        request({ status: "PENDING", approvedAt: null, approvedBy: null }),
      );

      mocks.leaveRequestUpdate.mockResolvedValue(
        request({ status: "APPROVED", approvedBy: "reviewer-001" }),
      );

      const result = await approveLeaveRequest("request-001", "reviewer-001");

      expect(result.success).toBe(true);
      expect(result.request?.status).toBe("approved");
      expect(result.request?.reviewedBy).toBe("reviewer-001");
    });

    it("prevents approving a rejected request", async () => {
      mocks.leaveRequestFindUnique.mockResolvedValue(
        request({ status: "REJECTED" }),
      );

      const result = await approveLeaveRequest("request-001", "reviewer-001");

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Only pending leave requests can be approved.",
      );

      expect(mocks.leaveRequestUpdate).not.toHaveBeenCalled();
    });
  });

  describe("rejectLeaveRequest", () => {
    it("rejects a pending request", async () => {
      mocks.leaveRequestFindUnique.mockResolvedValue(
        request({ status: "PENDING", approvedAt: null, approvedBy: null }),
      );

      mocks.leaveRequestUpdate.mockResolvedValue(
        request({ status: "REJECTED", approvedBy: "reviewer-001" }),
      );

      const result = await rejectLeaveRequest("request-001", "reviewer-001");

      expect(result.success).toBe(true);
      expect(result.request?.status).toBe("rejected");
    });

    it("prevents rejecting an approved request", async () => {
      mocks.leaveRequestFindUnique.mockResolvedValue(
        request({ status: "APPROVED" }),
      );

      const result = await rejectLeaveRequest("request-001", "reviewer-001");

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Only pending leave requests can be rejected.",
      );

      expect(mocks.leaveRequestUpdate).not.toHaveBeenCalled();
    });
  });

  describe("cancelLeaveRequest", () => {
    it("cancels an approved request", async () => {
      mocks.leaveRequestFindFirst.mockResolvedValue(
        request({ status: "APPROVED" }),
      );

      mocks.leaveRequestUpdate.mockResolvedValue(
        request({ status: "CANCELLED" }),
      );

      const result = await cancelLeaveRequest("request-001");

      expect(result.success).toBe(true);
      expect(result.request?.status).toBe("cancelled");
    });

    it("prevents cancelling a pending request", async () => {
      mocks.leaveRequestFindFirst.mockResolvedValue(
        request({ status: "PENDING" }),
      );

      const result = await cancelLeaveRequest("request-001");

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Only approved leave requests can be cancelled.",
      );

      expect(mocks.leaveRequestUpdate).not.toHaveBeenCalled();
    });
  });
});
