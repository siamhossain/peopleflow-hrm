import type { DefaultSession } from "next-auth";

type AppUserRole = "ADMIN" | "EMPLOYEE";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      employeeId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppUserRole;
    employeeId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AppUserRole;
    employeeId?: string | null;
  }
}
