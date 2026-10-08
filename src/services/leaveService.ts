// import { leaveRequests } from "@/data/leaveRequests";
// import { leaveTypes } from "@/data/leaveTypes";
// import { employees } from "@/data/employees";
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
  const start = new Date(`${request.startDate}T00:00:00`);
  const end = new Date(`${request.endDate}T00:00:00`);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const calendarDays =
    Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;

  if (request.duration === "half_day") {
    return calendarDays * 0.5;
  }

  return calendarDays;
};

// const getEmployeeById = (employeeId: string) => {
//   return employees.find((employee) => employee.id === employeeId);
// };

const getEmployeeById = async (employeeId: string) => {
  return prisma.employee.findUnique({
    where: {
      id: employeeId,
    },
  });
};

// const getLeaveTypeById = (leaveTypeId: string) => {
//   return leaveTypes.find((leaveType) => leaveType.id === leaveTypeId);
// };

const getLeaveTypeById = async (leaveTypeId: string) => {
  return prisma.leaveType.findUnique({
    where: {
      id: leaveTypeId,
    },
  });
};

// export const getLeaveRequests = (): LeaveRequest[] => {
//   return [...leaveRequests];
// };

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
    startDate: request.startDate.toISOString().slice(0, 10),
    endDate: request.endDate.toISOString().slice(0, 10),
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

// export const getEmployeeLeaveRequests = (
//   employeeId: string,
// ): LeaveRequest[] => {
//   return leaveRequests.filter((request) => request.employeeId === employeeId);
// };

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
    startDate: request.startDate.toISOString().slice(0, 10),
    endDate: request.endDate.toISOString().slice(0, 10),
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

// export const calculateLeaveBalance = (employeeId: string): LeaveBalance[] => {
//   const employeeRequests = getEmployeeLeaveRequests(employeeId);

//   return leaveTypes.map((leaveType) => {
//     const usedDays = employeeRequests
//       .filter(
//         (request) =>
//           request.leaveTypeId === leaveType.id && request.status === "approved",
//       )
//       .reduce((total, request) => total + calculateRequestDays(request), 0);

//     const pendingDays = employeeRequests
//       .filter(
//         (request) =>
//           request.leaveTypeId === leaveType.id && request.status === "pending",
//       )
//       .reduce((total, request) => total + calculateRequestDays(request), 0);

//     return {
//       leaveTypeId: leaveType.id,
//       leaveTypeName: leaveType.name,
//       allocatedDays: leaveType.annualAllocation,
//       usedDays,
//       pendingDays,
//       remainingDays: Math.max(0, leaveType.annualAllocation - usedDays),
//     };
//   });
// };

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
            startDate: request.startDate.toISOString().slice(0, 10),
            endDate: request.endDate.toISOString().slice(0, 10),
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
            startDate: request.startDate.toISOString().slice(0, 10),
            endDate: request.endDate.toISOString().slice(0, 10),
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
      remainingDays: Math.max(0, leaveType.defaultDays - usedDays),
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

  if (input.startDate > input.endDate) {
    return "Start date cannot be after end date.";
  }

  if (!input.reason.trim()) {
    return "Leave reason is required.";
  }

  if (input.duration === "half_day" && input.startDate !== input.endDate) {
    return "Half-day leave must use the same start and end date.";
  }

  if (input.startDate < employee.joiningDate) {
    return "Leave cannot start before the employee joining date.";
  }

  if (employee.resignationDate && input.endDate > employee.resignationDate) {
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
      startDate: new Date(`${input.startDate}T00:00:00`),
      endDate: new Date(`${input.endDate}T00:00:00`),
      duration: input.duration.toUpperCase() as "FULL_DAY" | "HALF_DAY",
      reason: input.reason.trim(),
      status: "PENDING",
    },
  });

  const request: LeaveRequest = {
    id: createdRequest.id,
    employeeId: createdRequest.employeeId,
    leaveTypeId: createdRequest.leaveTypeId,
    startDate: createdRequest.startDate.toISOString().slice(0, 10),
    endDate: createdRequest.endDate.toISOString().slice(0, 10),
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
    startDate: updatedRequest.startDate.toISOString().slice(0, 10),
    endDate: updatedRequest.endDate.toISOString().slice(0, 10),
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
    startDate: updatedRequest.startDate.toISOString().slice(0, 10),
    endDate: updatedRequest.endDate.toISOString().slice(0, 10),
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

export const cancelLeaveRequest = (requestId: string): LeaveActionResult => {
  const request = leaveRequests.find((item) => item.id === requestId);

  if (!request) {
    return {
      success: false,
      message: "Leave request not found.",
    };
  }

  if (request.status !== "approved") {
    return {
      success: false,
      message: "Only approved leave requests can be cancelled.",
    };
  }

  request.status = "cancelled";

  return {
    success: true,
    message: "Leave request cancelled successfully.",
    request,
  };
};
