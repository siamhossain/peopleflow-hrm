import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

export type NavigationRole = "admin" | "employee";

export interface NavigationItem {
  label: string;
  href: string;
  roles: NavigationRole[];
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["admin"],
    icon: LayoutDashboard,
  },
  {
    label: "Employees",
    href: "/employees",
    roles: ["admin"],
    icon: Users,
  },
  {
    label: "Attendance",
    href: "/attendance",
    roles: ["admin"],
    icon: Clock,
  },
  {
    label: "Leave",
    href: "/leave",
    roles: ["admin"],
    icon: CalendarDays,
  },
  {
    label: "Reports",
    href: "/reports",
    roles: ["admin"],
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    roles: ["admin"],
    icon: Settings,
  },
  {
    label: "My Profile",
    href: "/employee/profile",
    roles: ["employee"],
    icon: UserRound,
  },
  {
    label: "My Attendance",
    href: "/employee/attendance",
    roles: ["employee"],
    icon: Clock,
  },
  {
    label: "My Leave",
    href: "/employee/leave",
    roles: ["employee"],
    icon: CalendarDays,
  },
  {
    label: "My Requests",
    href: "/employee/requests",
    roles: ["employee"],
    icon: FileText,
  },
];
