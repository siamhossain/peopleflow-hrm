import type { NavigationRole } from "@/components/layout/navigation";

export interface MockSession {
  userId: string;
  employeeId: string;
  name: string;
  role: NavigationRole;
}

export const mockSessions: Record<NavigationRole, MockSession> = {
  admin: {
    userId: "user-admin-001",
    employeeId: "emp-006",
    name: "HR Administrator",
    role: "admin",
  },

  employee: {
    userId: "user-employee-001",
    employeeId: "emp-001",
    name: "Arif Hossain",
    role: "employee",
  },
};

export const mockSession = mockSessions.admin;
