import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "../../../auth";
import { AppShell } from "@/components/layout/AppShell";

interface EmployeeLayoutProps {
  children: ReactNode;
}

export default async function EmployeeLayout({
  children,
}: EmployeeLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  return <AppShell role="employee">{children}</AppShell>;
}
