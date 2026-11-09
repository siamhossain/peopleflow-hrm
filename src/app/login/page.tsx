"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

import { loginAsDemo } from "@/app/actions/demo-login";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemoLogin() {
    setError("");
    setIsLoading(true);

    try {
      await loginAsDemo();
    } catch (error) {
      console.error("Demo login failed:", error);
      setError("Unable to start the demo. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();

      if (!session?.user) {
        setError("Unable to retrieve your session. Please try again.");
        return;
      }

      if (session.user.role === "EMPLOYEE") {
        router.replace("/employee/attendance");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50">
            <Briefcase className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            WorkBridge HRM
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to access your workplace dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4.5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 select-none"
              >
                Work Email
              </label>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="h-10.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-4 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 select-none"
              >
                Password
              </label>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-10.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-10 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 shadow-2xs"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1.5">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
                className="w-full text-sm font-semibold rounded-xl"
              >
                Sign in to Account
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2.5 font-medium text-slate-400">
                  Or explore platform
                </span>
              </div>
            </div>

            {/* Demo Login Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleDemoLogin}
              disabled={isLoading}
              leftIcon={<Sparkles className="h-4 w-4 text-indigo-600" />}
              className="w-full text-sm font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              Explore Live Demo
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          WorkBridge HRM • Modern Workforce Management Platform
        </p>
      </div>
    </main>
  );
}
