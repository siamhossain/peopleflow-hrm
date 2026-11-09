import { attendanceSettings } from "@/data/settings";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarDays,
  Clock,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
} from "lucide-react";

const dayNames = [
  { dayIndex: 0, name: "Sunday", short: "Sun" },
  { dayIndex: 1, name: "Monday", short: "Mon" },
  { dayIndex: 2, name: "Tuesday", short: "Tue" },
  { dayIndex: 3, name: "Wednesday", short: "Wed" },
  { dayIndex: 4, name: "Thursday", short: "Thu" },
  { dayIndex: 5, name: "Friday", short: "Fri" },
  { dayIndex: 6, name: "Saturday", short: "Sat" },
];

export default function SettingsPage() {
  const isWorkingDay = (index: number) =>
    attendanceSettings.workingDays.includes(index);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            System Configuration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review active operational parameters, attendance policies, and standard working schedules.
          </p>
        </div>

        <Badge variant="success" dot size="md">
          Active Production Config
        </Badge>
      </div>

      {/* Attendance & Shift Policies Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600" />
            <div>
              <CardTitle>Attendance & Shift Policies</CardTitle>
              <CardDescription>
                Default working hours, automated late-grace thresholds, and schedule definitions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Parameters Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Office Start Time
                </p>
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {attendanceSettings.officeStartTime}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Standard shift check-in
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Office End Time
                </p>
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {attendanceSettings.officeEndTime}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Standard shift check-out
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Late Grace Threshold
                </p>
                <Timer className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
                {attendanceSettings.lateThresholdMinutes}{" "}
                <span className="text-sm font-medium text-slate-500">min</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Grace period before late penalty
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">
                  Working Days
                </p>
                <CalendarDays className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {attendanceSettings.workingDays.length}{" "}
                <span className="text-sm font-medium text-slate-500">days/week</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Standard weekly commitment
              </p>
            </div>
          </div>

          {/* Weekly Work Schedule Visual Matrix */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-2xs">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly Work Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Operational days observed by automated attendance tracking.
                </p>
              </div>

              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                Sunday through Thursday
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {dayNames.map((day) => {
                const active = isWorkingDay(day.dayIndex);

                return (
                  <div
                    key={day.dayIndex}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      active
                        ? "border-indigo-200 bg-indigo-50/40 text-indigo-900 shadow-2xs"
                        : "border-slate-100 bg-slate-50/60 text-slate-400"
                    }`}
                  >
                    <span className="text-xs font-semibold sm:hidden">
                      {day.short}
                    </span>
                    <span className="hidden text-xs font-semibold sm:inline">
                      {day.name}
                    </span>
                    <span
                      className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                        active ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    />
                    <span
                      className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${
                        active ? "text-indigo-600" : "text-slate-400"
                      }`}
                    >
                      {active ? "Work" : "Off"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform & System Architecture Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <div>
              <CardTitle>System Information & Access Policy</CardTitle>
              <CardDescription>
                Application runtime architecture, authentication roles, and permission levels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Theme & UI Engine</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Light SaaS Standard
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Geist Typography & Tailwind CSS
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Authentication & Roles</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Role-Based RBAC
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Admin, Employee & Demo Viewer
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                <Clock className="h-4 w-4 text-sky-600" />
                <span>State & Persistence</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Live Database Backed
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Prisma ORM & PostgreSQL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
