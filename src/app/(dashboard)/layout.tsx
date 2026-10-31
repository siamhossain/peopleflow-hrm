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

  if (session.user.role !== "ADMIN") {
    redirect("/employee/attendance");
  }

  return <AppShell role="admin">{children}</AppShell>;
}
