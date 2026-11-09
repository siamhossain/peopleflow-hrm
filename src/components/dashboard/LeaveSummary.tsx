import { Ban, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface LeaveSummaryProps {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

const items = [
  {
    label: "Pending",
    key: "pending",
    icon: Clock,
    containerStyle: "border-amber-200/70 bg-amber-50/40 hover:bg-amber-50/70",
    iconBg: "bg-amber-100 text-amber-700",
    countColor: "text-amber-900",
    description: "Awaiting HR decision",
  },
  {
    label: "Approved",
    key: "approved",
    icon: CheckCircle2,
    containerStyle: "border-emerald-200/70 bg-emerald-50/40 hover:bg-emerald-50/70",
    iconBg: "bg-emerald-100 text-emerald-700",
    countColor: "text-emerald-900",
    description: "Granted time off",
  },
  {
    label: "Rejected",
    key: "rejected",
    icon: XCircle,
    containerStyle: "border-rose-200/70 bg-rose-50/40 hover:bg-rose-50/70",
    iconBg: "bg-rose-100 text-rose-700",
    countColor: "text-rose-900",
    description: "Declined requests",
  },
  {
    label: "Cancelled",
    key: "cancelled",
    icon: Ban,
    containerStyle: "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50/90",
    iconBg: "bg-slate-200/70 text-slate-700",
    countColor: "text-slate-900",
    description: "Revoked submissions",
  },
] as const;

export function LeaveSummary({
  pending,
  approved,
  rejected,
  cancelled,
}: LeaveSummaryProps) {
  const values = {
    pending,
    approved,
    rejected,
    cancelled,
  };

  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leave Summary</CardTitle>
            <CardDescription className="mt-1">
              Status overview across all leave requests.
            </CardDescription>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Logged
            </span>
            <p className="text-lg font-bold text-slate-900">{total}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-3.5">
          {items.map((item) => {
            const Icon = item.icon;
            const count = values[item.key];

            return (
              <div
                key={item.key}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all shadow-2xs ${item.containerStyle}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {item.label}
                  </span>

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.iconBg}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-3">
                  <p className={`text-2xl font-bold tracking-tight ${item.countColor}`}>
                    {count}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
