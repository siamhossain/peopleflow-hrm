import * as React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "neutral"
  | "indigo";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> =
  {
    success: {
      container: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      dot: "bg-emerald-500",
    },
    warning: {
      container: "bg-amber-50 text-amber-700 border-amber-200/60",
      dot: "bg-amber-500",
    },
    danger: {
      container: "bg-rose-50 text-rose-700 border-rose-200/60",
      dot: "bg-rose-500",
    },
    info: {
      container: "bg-sky-50 text-sky-700 border-sky-200/60",
      dot: "bg-sky-500",
    },
    purple: {
      container: "bg-purple-50 text-purple-700 border-purple-200/60",
      dot: "bg-purple-500",
    },
    neutral: {
      container: "bg-slate-100 text-slate-700 border-slate-200/60",
      dot: "bg-slate-400",
    },
    indigo: {
      container: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      dot: "bg-indigo-500",
    },
  };

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  className = "",
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium capitalize tracking-tight select-none ${styles.container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
