import { redirect } from "next/navigation";

import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export default async function EmployeeProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAllowedRole =
    session.user.role === "EMPLOYEE" || session.user.role === "DEMO_VIEWER";

  if (!isAllowedRole || !session.user.employeeId) {
    redirect("/dashboard");
  }

  const employee = await prisma.employee.findUnique({
    where: {
      id: session.user.employeeId,
    },
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      designation: true,
      joinDate: true,
      status: true,
      department: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  });

  if (!employee) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        <p className="mt-4 text-sm text-red-600">
          Your employee profile could not be found. Please contact HR.
        </p>
      </section>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  const formattedJoinDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(employee.joinDate);

  return (
    <section>
      <div>
        <p className="text-sm font-medium text-gray-500">Employee Portal</p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">My Profile</h1>

        <p className="mt-2 text-sm text-gray-600">Welcome back, {fullName}.</p>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Personal Information
        </h2>

        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Employee ID</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {employee.employeeCode}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Full Name</dt>
            <dd className="mt-1 font-medium text-gray-900">{fullName}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="mt-1 font-medium text-gray-900">{employee.email}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Phone</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {employee.phone || "Not provided"}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Designation</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {employee.designation}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Department</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {employee.department.name}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Department Code</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {employee.department.code}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Joining Date</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formattedJoinDate}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Employment Status</dt>
            <dd className="mt-1 font-medium capitalize text-gray-900">
              {employee.status.replace("_", " ").toLowerCase()}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
