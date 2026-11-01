"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";

interface HeaderProps {
  role: "admin" | "employee";
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Header({ role, user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = user.name?.trim() || "User";
  const displayEmail = user.email || "";
  const roleLabel = role === "admin" ? "Administrator" : "Employee";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await signOut({ redirectTo: "/login" });
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="lg:hidden">
          <span className="text-lg font-semibold text-gray-900">
            WorkBridge HRM
          </span>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsAccountMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
          aria-expanded={isAccountMenuOpen}
          aria-label="Open account menu"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {initials || <UserRound size={18} />}
          </div>

          <div className="hidden text-left sm:block">
            <p className="max-w-40 truncate text-sm font-medium text-gray-900">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>

          <ChevronDown
            size={16}
            className={`hidden text-gray-500 transition-transform sm:block ${
              isAccountMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isAccountMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close account menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsAccountMenuOpen(false)}
            />

            <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {displayEmail}
                </p>

                <p className="mt-2 text-xs font-medium text-blue-700">
                  {roleLabel}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={17} />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />

          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <Sidebar
              role={role}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
