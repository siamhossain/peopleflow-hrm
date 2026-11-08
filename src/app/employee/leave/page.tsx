import { redirect } from "next/navigation";

import { auth } from "../../../../auth";
import MyLeaveClient from "./MyLeaveClient";

export default async function MyLeavePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, employeeId } = session.user;

  if (role !== "EMPLOYEE" && role !== "DEMO_VIEWER") {
    redirect("/dashboard");
  }

  if (!employeeId) {
    redirect("/login");
  }

  return (
    <MyLeaveClient
      employeeId={employeeId}
      canRequestLeave={role === "EMPLOYEE"}
    />
  );
}
