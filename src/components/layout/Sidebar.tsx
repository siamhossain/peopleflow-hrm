"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

import { navigationItems, type NavigationRole } from "./navigation";

interface SidebarProps {
  role: NavigationRole;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ role, mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside
      className={
        mobile
          ? "w-full flex-1 flex flex-col h-full min-h-0 bg-white"
          : "hidden w-64 shrink-0 border-r border-slate-200/80 bg-white lg:block"
      }
    >
      <div
        className={
          mobile
            ? "flex-1 flex flex-col h-full min-h-0"
            : "flex min-h-screen flex-col"
        }
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-200/80 px-6 ${
            mobile ? "pr-14" : ""
          }`}
        >
          <Link
            href={role === "admin" ? "/dashboard" : "/employee/profile"}
            className="flex items-center gap-2.5 transition opacity-95 hover:opacity-100"
            onClick={onNavigate}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shadow-indigo-600/30">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                PeopleOS
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase mt-0.5">
                HRM Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 min-h-0">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
            {role === "admin" ? "Management" : "Employee Portal"}
          </p>

          <nav className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-50 font-semibold text-indigo-700 shadow-2xs"
                      : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      isActive
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom subtle role tag */}
        <div className="shrink-0 border-t border-slate-100 p-3.5">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 capitalize">
              {role === "admin" ? "Admin Mode" : "Employee Mode"}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PeopleOS v1.0
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
