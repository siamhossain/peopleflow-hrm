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

  const isDemoViewer = session.user.role === "DEMO_VIEWER";

  if (session.user.role !== "EMPLOYEE" && !isDemoViewer) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      role="employee"
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
