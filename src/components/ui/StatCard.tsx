import * as React from "react";
import type { LucideIcon } from "lucide-react";

export type StatCardColor =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "purple"
  | "slate";

export interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  color?: StatCardColor;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

const colorStyles: Record<
  StatCardColor,
  { iconBg: string; iconColor: string; ringColor: string }
> = {
  indigo: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    ringColor: "ring-indigo-100/60",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    ringColor: "ring-emerald-100/60",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    ringColor: "ring-amber-100/60",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    ringColor: "ring-rose-100/60",
  },
  sky: {
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    ringColor: "ring-sky-100/60",
  },
  purple: {
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    ringColor: "ring-purple-100/60",
  },
  slate: {
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    ringColor: "ring-slate-200/60",
  },
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  color = "indigo",
  trend,
  className = "",
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.iconBg} ${styles.iconColor} ${styles.ringColor}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100/80 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.value}
            </span>
          )}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
