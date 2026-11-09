import { redirect } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";

import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          Your employee profile could not be found. Please contact HR.
        </div>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  const formattedJoinDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(employee.joinDate);

  const statusVariantMap: Record<string, BadgeVariant> = {
    ACTIVE: "success",
    INACTIVE: "neutral",
    ON_LEAVE: "purple",
    RESIGNED: "danger",
  };

  const statusVariant = statusVariantMap[employee.status] ?? "neutral";

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review your personal details and employment information.
        </p>
      </div>

      {/* Hero Profile Overview Card */}
      <Card className="overflow-hidden border-indigo-100/80 bg-gradient-to-r from-white via-indigo-50/20 to-white">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            {/* Avatar Initials Badge */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-md ring-4 ring-white">
              {initials || <User className="h-10 w-10" />}
            </div>

            {/* Profile Info Summary */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                  {fullName}
                </h2>
                <Badge variant={statusVariant} dot>
                  {employee.status.replace("_", " ")}
                </Badge>
              </div>

              <p className="text-sm font-medium text-slate-600">
                {employee.designation} ·{" "}
                <span className="text-indigo-600 font-semibold">
                  {employee.department.name}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                  Code: <strong className="text-slate-700">{employee.employeeCode}</strong>
                </span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Joined {formattedJoinDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Personal Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <User className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Primary identity and contact information.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Full Legal Name
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {fullName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Employee ID Code
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {employee.employeeCode}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                  {employee.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {employee.phone || "Not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Organization Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Department, role, and employment credentials.</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <Briefcase className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Designation / Role
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {employee.designation}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {employee.department.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <Tag className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department Code
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {employee.department.code}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
              <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Employment Status
                </p>
                <div className="mt-1">
                  <Badge variant={statusVariant} dot>
                    {employee.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
