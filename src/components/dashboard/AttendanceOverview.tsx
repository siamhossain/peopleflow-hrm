import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface AttendanceOverviewProps {
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  onLeave: number;
}

const items = [
  {
    label: "Present",
    key: "present",
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    badgeBg: "bg-emerald-50",
    dotColor: "bg-emerald-500",
  },
  {
    label: "Late",
    key: "late",
    color: "bg-amber-500",
    textColor: "text-amber-700",
    badgeBg: "bg-amber-50",
    dotColor: "bg-amber-500",
  },
  {
    label: "Half Day",
    key: "halfDay",
    color: "bg-sky-500",
    textColor: "text-sky-700",
    badgeBg: "bg-sky-50",
    dotColor: "bg-sky-500",
  },
  {
    label: "Absent",
    key: "absent",
    color: "bg-rose-500",
    textColor: "text-rose-700",
    badgeBg: "bg-rose-50",
    dotColor: "bg-rose-500",
  },
  {
    label: "On Leave",
    key: "onLeave",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    badgeBg: "bg-purple-50",
    dotColor: "bg-purple-500",
  },
] as const;

export function AttendanceOverview({
  present,
  late,
  halfDay,
  absent,
  onLeave,
}: AttendanceOverviewProps) {
  const values = {
    present,
    late,
    halfDay,
    absent,
    onLeave,
  };

  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription className="mt-1">
              Today&apos;s workforce attendance distribution.
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Staff
            </span>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
        </div>

        {/* Combined multi-segment progress strip */}
        {total > 0 && (
          <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
            {items.map((item) => {
              const val = values[item.key];
              const pct = (val / total) * 100;
              if (pct <= 0) return null;
              return (
                <div
                  key={`seg-${item.key}`}
                  className={`${item.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${val} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {items.map((item) => {
          const value = values[item.key];
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${item.dotColor}`}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-slate-700">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{value}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-medium ${item.badgeBg} ${item.textColor}`}
                  >
                    {percentage}%
                  </span>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
