import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "../../../auth";
import { AppShell } from "@/components/layout/AppShell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isDemoViewer = session.user.role === "DEMO_VIEWER";

  if (session.user.role !== "ADMIN" && !isDemoViewer) {
    redirect("/employee/attendance");
  }

  return (
    <AppShell
      role="admin"
      isDemoViewer={isDemoViewer}
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </AppShell>
  );
}
