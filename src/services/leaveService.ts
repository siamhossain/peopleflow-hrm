import { prisma } from "@/lib/prisma";
import type { LeaveRequest } from "@/types/leave";

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface CreateLeaveRequestInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  duration: "full_day" | "half_day";
  reason: string;
}

export interface LeaveActionResult {
  success: boolean;
  message: string;
  request?: LeaveRequest;
}

const formatDateOnly = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return [year, month, day].join("-");
};

const parseDateOnly = (date: string): Date => {
  return new Date(`${date}T00:00:00.000Z`);
};

const isDateRangeOverlapping = (
  startDate: string,
  endDate: string,
  existingStartDate: string,
  existingEndDate: string,
): boolean => {
  return startDate <= existingEndDate && endDate >= existingStartDate;
};

const calculateRequestDays = (
  request: Pick<LeaveRequest, "startDate" | "endDate" | "duration">,
): number => {
  const start = parseDateOnly(request.startDate);
  const end = parseDateOnly(request.endDate);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const calendarDays =
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;

  return request.duration === "half_day" ? calendarDays * 0.5 : calendarDays;
};

const getEmployeeById = async (employeeId: string) => {
  return prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });
};

const getLeaveTypeById = async (leaveTypeId: string) => {
  return prisma.leaveType.findUnique({
    where: {
      id: leaveTypeId,
    },
  });
};

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const requests = await prisma.leaveRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((request) => ({
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
  }));
};

export const getEmployeeLeaveRequests = async (
  employeeId: string,
): Promise<LeaveRequest[]> => {
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map((request) => ({
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
  }));
};

export const calculateLeaveBalance = async (
  employeeId: string,
): Promise<LeaveBalance[]> => {
  const [leaveTypes, employeeRequests] = await Promise.all([
    prisma.leaveType.findMany({
      where: {
        isActive: true,
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId,
      },
    }),
  ]);

  return leaveTypes.map((leaveType) => {
    const requestsForType = employeeRequests.filter(
      (request) => request.leaveTypeId === leaveType.id,
    );

    const usedDays = requestsForType
      .filter((request) => request.status === "APPROVED")
      .reduce(
        (total, request) =>
          total +
          calculateRequestDays({
            startDate: formatDateOnly(request.startDate),
            endDate: formatDateOnly(request.endDate),
            duration: request.duration.toLowerCase() as "full_day" | "half_day",
          }),
        0,
      );

    const pendingDays = requestsForType
      .filter((request) => request.status === "PENDING")
      .reduce(
        (total, request) =>
          total +
          calculateRequestDays({
            startDate: formatDateOnly(request.startDate),
            endDate: formatDateOnly(request.endDate),
            duration: request.duration.toLowerCase() as "full_day" | "half_day",
          }),
        0,
      );

    return {
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      allocatedDays: leaveType.defaultDays,
      usedDays,
      pendingDays,
      remainingDays: Math.max(
        0,
        leaveType.defaultDays - usedDays - pendingDays,
      ),
    };
  });
};

export const validateLeaveRequest = async (
  input: CreateLeaveRequestInput,
): Promise<string | null> => {
  const employee = await getEmployeeById(input.employeeId);

  if (!employee) {
    return "Employee not found.";
  }

  const leaveType = await getLeaveTypeById(input.leaveTypeId);

  if (!leaveType) {
    return "Leave type not found.";
  }

  if (!leaveType.isActive) {
    return "This leave type is inactive.";
  }

  if (input.startDate > input.endDate) {
    return "Start date cannot be after end date.";
  }

  if (input.duration === "half_day" && input.startDate !== input.endDate) {
    return "Half-day leave must use the same start and end date.";
  }

  if (input.duration === "half_day" && !leaveType.allowHalfDay) {
    return "Half-day leave is not allowed for this leave type.";
  }

  if (!input.reason.trim()) {
    return "Leave reason is required.";
  }

  const employeeJoinDate = formatDateOnly(employee.joinDate);

  const employeeResignationDate = employee.resignationDate
    ? formatDateOnly(employee.resignationDate)
    : undefined;

  if (input.startDate < employeeJoinDate) {
    return "Leave cannot start before the employee joining date.";
  }

  if (employeeResignationDate && input.endDate > employeeResignationDate) {
    return "Leave cannot extend beyond the employee resignation date.";
  }

  const existingRequests = await getEmployeeLeaveRequests(input.employeeId);

  const overlappingRequest = existingRequests.find(
    (request) =>
      request.status !== "rejected" &&
      request.status !== "cancelled" &&
      isDateRangeOverlapping(
        input.startDate,
        input.endDate,
        request.startDate,
        request.endDate,
      ),
  );

  if (overlappingRequest) {
    return "Leave request overlaps with an existing leave request.";
  }

  const requestedDays = calculateRequestDays(input);

  const balance = (await calculateLeaveBalance(input.employeeId)).find(
    (item) => item.leaveTypeId === input.leaveTypeId,
  );

  if (!balance) {
    return "Leave balance could not be calculated.";
  }

  if (
    balance.usedDays + balance.pendingDays + requestedDays >
    balance.allocatedDays
  ) {
    return "Requested leave exceeds the available leave balance.";
  }

  return null;
};

export const createLeaveRequest = async (
  input: CreateLeaveRequestInput,
): Promise<LeaveActionResult> => {
  const validationError = await validateLeaveRequest(input);

  if (validationError) {
    return {
      success: false,
      message: validationError,
    };
  }

  const createdRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: parseDateOnly(input.startDate),
      endDate: parseDateOnly(input.endDate),
      duration: input.duration.toUpperCase() as "FULL_DAY" | "HALF_DAY",
      reason: input.reason.trim(),
      status: "PENDING",
    },
  });

  const request: LeaveRequest = {
    id: createdRequest.id,
    employeeId: createdRequest.employeeId,
    leaveTypeId: createdRequest.leaveTypeId,
    startDate: formatDateOnly(createdRequest.startDate),
    endDate: formatDateOnly(createdRequest.endDate),
    duration: createdRequest.duration.toLowerCase() as "full_day" | "half_day",
    reason: createdRequest.reason,
    status: createdRequest.status.toLowerCase() as
      | "pending"
      | "approved"
      | "rejected"
      | "cancelled",
    createdAt: createdRequest.createdAt.toISOString(),
    reviewedAt: createdRequest.approvedAt?.toISOString(),
    reviewedBy: createdRequest.approvedBy ?? undefined,
  };

  return {
    success: true,
    message: "Leave request created successfully.",
    request,
  };
};

export const approveLeaveRequest = async (
  requestId: string,
  reviewerId: string,
): Promise<LeaveActionResult> => {
  const request = await prisma.leaveRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!request) {
    return {
      success: false,
      message: "Leave request not found.",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "Only pending leave requests can be approved.",
    };
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: reviewerId,
    },
  });

  const mappedRequest: LeaveRequest = {
    id: updatedRequest.id,
    employeeId: updatedRequest.employeeId,
    leaveTypeId: updatedRequest.leaveTypeId,
    startDate: formatDateOnly(updatedRequest.startDate),
    endDate: formatDateOnly(updatedRequest.endDate),
    duration: updatedRequest.duration.toLowerCase() as "full_day" | "half_day",
    reason: updatedRequest.reason,
    status: updatedRequest.status.toLowerCase() as
      | "pending"
      | "approved"
      | "rejected"
      | "cancelled",
    createdAt: updatedRequest.createdAt.toISOString(),
    reviewedAt: updatedRequest.approvedAt?.toISOString(),
    reviewedBy: updatedRequest.approvedBy ?? undefined,
  };

  return {
    success: true,
    message: "Leave request approved successfully.",
    request: mappedRequest,
  };
};

export const rejectLeaveRequest = async (
  requestId: string,
  reviewerId: string,
): Promise<LeaveActionResult> => {
  const request = await prisma.leaveRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!request) {
    return {
      success: false,
      message: "Leave request not found.",
    };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: "Only pending leave requests can be rejected.",
    };
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: "REJECTED",
      approvedAt: new Date(),
      approvedBy: reviewerId,
    },
  });

  const mappedRequest: LeaveRequest = {
    id: updatedRequest.id,
    employeeId: updatedRequest.employeeId,
    leaveTypeId: updatedRequest.leaveTypeId,
    startDate: formatDateOnly(updatedRequest.startDate),
    endDate: formatDateOnly(updatedRequest.endDate),
    duration: updatedRequest.duration.toLowerCase() as "full_day" | "half_day",
    reason: updatedRequest.reason,
    status: updatedRequest.status.toLowerCase() as
      | "pending"
      | "approved"
      | "rejected"
      | "cancelled",
    createdAt: updatedRequest.createdAt.toISOString(),
    reviewedAt: updatedRequest.approvedAt?.toISOString(),
    reviewedBy: updatedRequest.approvedBy ?? undefined,
  };

  return {
    success: true,
    message: "Leave request rejected successfully.",
    request: mappedRequest,
  };
};

export const cancelLeaveRequest = async (
  requestId: string,
): Promise<LeaveActionResult> => {
  const request = await prisma.leaveRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!request) {
    return {
      success: false,
      message: "Leave request not found.",
    };
  }

  if (request.status !== "APPROVED") {
    return {
      success: false,
      message: "Only approved leave requests can be cancelled.",
    };
  }

  const updatedRequest = await prisma.leaveRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  const mappedRequest: LeaveRequest = {
    id: updatedRequest.id,
    employeeId: updatedRequest.employeeId,
    leaveTypeId: updatedRequest.leaveTypeId,
    startDate: formatDateOnly(updatedRequest.startDate),
    endDate: formatDateOnly(updatedRequest.endDate),
    duration: updatedRequest.duration.toLowerCase() as "full_day" | "half_day",
    reason: updatedRequest.reason,
    status: updatedRequest.status.toLowerCase() as
      | "pending"
      | "approved"
      | "rejected"
      | "cancelled",
    createdAt: updatedRequest.createdAt.toISOString(),
    reviewedAt: updatedRequest.approvedAt?.toISOString(),
    reviewedBy: updatedRequest.approvedBy ?? undefined,
  };

  return {
    success: true,
    message: "Leave request cancelled successfully.",
    request: mappedRequest,
  };
};
