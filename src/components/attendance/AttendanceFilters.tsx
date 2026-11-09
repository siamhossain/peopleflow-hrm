"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";

interface AttendanceFiltersProps {
  departments: {
    id: string;
    name: string;
  }[];
  statuses: {
    value: string;
    label: string;
  }[];
}

export function AttendanceFilters({
  departments,
  statuses,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const date = searchParams.get("date") ?? "2026-08-20";
  const status = searchParams.get("status") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/attendance?${params.toString()}`);
  };

  const changeDate = (offset: number) => {
    const currentDate = new Date(`${date}T00:00:00`);

    currentDate.setDate(currentDate.getDate() + offset);

    const nextDate = currentDate.toISOString().split("T")[0];

    updateFilters({ date: nextDate });
  };

  const resetFilters = () => {
    router.push("/attendance");
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label
            htmlFor="attendance-date"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Date
          </label>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => changeDate(-1)}
              aria-label="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(event) => updateFilters({ date: event.target.value })}
              className="h-9.5 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => changeDate(1)}
              aria-label="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <Select
            id="attendance-status"
            label="Status"
            value={status}
            onChange={(event) => updateFilters({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex-1">
          <Select
            id="attendance-department"
            label="Department"
            value={departmentId}
            onChange={(event) =>
              updateFilters({
                departmentId: event.target.value,
              })
            }
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={resetFilters}
            leftIcon={<FilterX className="h-4 w-4" />}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
