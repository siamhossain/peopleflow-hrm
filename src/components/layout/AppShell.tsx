"use client";

import type { ReactNode } from "react";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { NavigationRole } from "./navigation";

interface AppShellProps {
  children: ReactNode;
  role: NavigationRole;
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AppShell({ children, role, user }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <Sidebar role={role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header role={role} user={user} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
