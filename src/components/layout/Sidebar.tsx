"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
          ? "w-72 bg-white"
          : "hidden w-64 shrink-0 border-r bg-white lg:block"
      }
    >
      <div className={mobile ? "flex flex-col" : "flex min-h-screen flex-col"}>
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href={role === "admin" ? "/dashboard" : "/employee/profile"}
            className="text-xl font-bold"
            onClick={onNavigate}
          >
            Betopia HRM
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
