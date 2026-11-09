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
  isDemoViewer?: boolean;
}

export function AppShell({
  children,
  role,
  user,
  isDemoViewer = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar role={role} />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Header role={role} user={user} isDemoViewer={isDemoViewer} />

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
