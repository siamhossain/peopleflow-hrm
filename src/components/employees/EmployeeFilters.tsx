"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

import type { Employee, Department } from "@/types/employee";
import type { PaginatedEmployees } from "@/services/employeeService";

interface EmployeeFiltersProps {
  initialEmployees: Employee[];
}

const PAGE_SIZE = 10;

const EMPTY_RESULT: PaginatedEmployees = {
  data: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
};

export function EmployeeFilters({ initialEmployees }: EmployeeFiltersProps) {
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<Employee["status"] | "">("");
  const [sortBy, setSortBy] = useState<"name" | "joiningDate" | "employeeCode">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedEmployees>({
    ...EMPTY_RESULT,
    data: initialEmployees.slice(0, PAGE_SIZE),
    total: initialEmployees.length,
    totalPages: Math.max(1, Math.ceil(initialEmployees.length / PAGE_SIZE)),
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDeactivate, setEmployeeToDeactivate] =
    useState<Employee | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEmployees() {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        search,
        departmentId,
        status,
        sortBy,
        sortOrder,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      try {
        const response = await fetch(`/api/employees?${params.toString()}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          data?: PaginatedEmployees;
          message?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.message ?? "Failed to load employees.");
        }

        setResult(payload.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Failed to load employees.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchEmployees();

    return () => controller.abort();
  }, [search, departmentId, status, sortBy, sortOrder, page, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDepartments() {
      try {
        const response = await fetch("/api/departments", {
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          data?: Department[] | { data?: Department[] };
        };

        if (!response.ok || !payload.data) {
          throw new Error("Failed to load departments.");
        }

        const data = Array.isArray(payload.data)
          ? payload.data
          : payload.data.data;

        if (data) {
          setDepartments(data);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // Department options remain empty until the endpoint is available.
      }
    }

    void fetchDepartments();

    return () => controller.abort();
  }, []);

  const hasFilters = Boolean(
    search ||
    departmentId ||
    status ||
    sortBy !== "name" ||
    sortOrder !== "asc",
  );

  const clearFilters = () => {
    setSearch("");
    setDepartmentId("");
    setStatus("");
    setSortBy("name");
    setSortOrder("asc");
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [nextSortBy, nextSortOrder] = value.split("-") as [
      "name" | "joiningDate" | "employeeCode",
      "asc" | "desc",
    ];

    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setPage(1);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(null);
    setEditingEmployee(employee);
  };

  const handleDeactivateEmployee = async () => {
    if (!employeeToDeactivate || isDeactivating) {
      return;
    }

    setIsDeactivating(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeToDeactivate.id}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to deactivate employee.");
      }

      const employeeName = `${employeeToDeactivate.firstName} ${employeeToDeactivate.lastName}`;

      setEmployeeToDeactivate(null);
      setSuccessMessage(`${employeeName} has been deactivated successfully.`);

      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate employee.",
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          Add Employee
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label
              htmlFor="employee-search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="employee-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, email, code or designation..."
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="employee-department"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Department
            </label>

            <select
              id="employee-department"
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="employee-status"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="employee-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as Employee["status"] | "");
                setPage(1);
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="resigned">Resigned</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="employee-sort"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Sort By
            </label>

            <select
              id="employee-sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(event) => handleSortChange(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="joiningDate-asc">Joining Date — Oldest</option>
              <option value="joiningDate-desc">Joining Date — Newest</option>
              <option value="employeeCode-asc">
                Employee Code — Ascending
              </option>
              <option value="employeeCode-desc">
                Employee Code — Descending
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {isLoading
              ? "Loading employees..."
              : `Showing ${
                  result.total === 0
                    ? 0
                    : (result.page - 1) * result.pageSize + 1
                }–${Math.min(result.page * result.pageSize, result.total)} of ${
                  result.total
                } employees`}
          </p>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {successMessage && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </p>
      )}

      <div className="mt-6">
        <EmployeeTable
          employees={result.data}
          onView={setSelectedEmployee}
          onEdit={handleEditEmployee}
          onDeactivate={setEmployeeToDeactivate}
        />
      </div>

      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-500">
            Page {result.page} of {result.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={isLoading || result.page === 1}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(result.totalPages, current + 1))
              }
              disabled={isLoading || result.page === result.totalPages}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={handleEditEmployee}
        />
      )}

      {(isCreateModalOpen || editingEmployee) && (
        <EmployeeForm
          departments={departments}
          employee={editingEmployee ?? undefined}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            setEditingEmployee(null);
            setPage(1);
            setRefreshKey((current) => current + 1);
          }}
        />
      )}

      {/* Deactivation Confirmation Dialog */}
      {employeeToDeactivate && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeactivating) {
              setEmployeeToDeactivate(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-dialog-title"
            aria-describedby="deactivate-dialog-description"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={22} className="text-red-600" />
                </div>

                <h2
                  id="deactivate-dialog-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Deactivate Employee
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleDeactivateEmployee()}
                disabled={isDeactivating}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Loader2
                  size={16}
                  className={isDeactivating ? "animate-spin" : "invisible"}
                />

                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </button>
            </div>

            <p
              id="deactivate-dialog-description"
              className="mt-4 text-sm leading-6 text-gray-600"
            >
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-gray-900">
                {employeeToDeactivate.firstName} {employeeToDeactivate.lastName}
              </span>
              ? This employee will no longer be active, but their existing
              records and history will be preserved.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEmployeeToDeactivate(null)}
                disabled={isDeactivating}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeactivateEmployee()}
                disabled={isDeactivating}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeactivating && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
