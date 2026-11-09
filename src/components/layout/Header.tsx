"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowLeftRight,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";

interface HeaderProps {
  role: "admin" | "employee";
  user: {
    name?: string | null;
    email?: string | null;
  };
  isDemoViewer?: boolean;
}

export function Header({ role, user, isDemoViewer = false }: HeaderProps) {
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = user.name?.trim() || "User";
  const displayEmail = user.email || "";

  const roleLabel = isDemoViewer
    ? "Demo Viewer"
    : role === "admin"
      ? "Administrator"
      : "Employee";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  // Prevent background scrolling and handle Escape key when mobile drawer is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  function handleDemoViewChange() {
    if (!isDemoViewer) return;

    setIsAccountMenuOpen(false);

    router.push(role === "admin" ? "/employee/attendance" : "/dashboard");
  }

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
    <header
      className={`sticky top-0 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8 transition-shadow ${
        isMobileMenuOpen ? "z-50" : "z-30"
      }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Mobile Branding */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            PeopleOS HRM
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo View Switcher */}
        {isDemoViewer && (
          <button
            type="button"
            onClick={handleDemoViewChange}
            className="flex items-center gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors hover:bg-indigo-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            aria-label={`Switch to ${
              role === "admin" ? "Employee" : "Admin"
            } View`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />

            <span className="hidden sm:inline">
              Switch to {role === "admin" ? "Employee" : "Admin"} View
            </span>

            <span className="sm:hidden">Switch View</span>
          </button>
        )}

        {/* Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((open) => !open)}
            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-100/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
            aria-expanded={isAccountMenuOpen}
            aria-label="Open account menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200/80 shadow-2xs">
              {initials || <UserRound className="h-4 w-4" />}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-36 truncate text-xs font-semibold text-slate-900 leading-tight">
                {displayName}
              </p>

              <p className="text-[11px] text-slate-500 leading-tight">
                {roleLabel}
              </p>
            </div>

            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block ${
                isAccountMenuOpen ? "rotate-180 text-slate-600" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {isAccountMenuOpen && (
            <>
              {/* Click outside to close account menu */}
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsAccountMenuOpen(false)}
              />

              <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/10">
                <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {displayEmail}
                  </p>

                  <div className="mt-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200/60">
                    {roleLabel}
                  </div>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer with Smooth Slide & Fade Transition */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "visible pointer-events-auto"
            : "invisible pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop overlay */}
        <button
          type="button"
          className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          tabIndex={isMobileMenuOpen ? 0 : -1}
        />

        {/* Drawer Panel: smooth slide-in from left */}
        <div
          className={`fixed inset-y-0 left-0 z-50 flex h-full h-[100dvh] w-72 max-w-[85vw] flex-col bg-white shadow-2xl overflow-hidden transition-transform duration-300 ease-out will-change-transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close button positioned cleanly in drawer header */}
          <div className="absolute right-3.5 top-3.5 z-10">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20"
              aria-label="Close navigation"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <Sidebar
            role={role}
            mobile
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
