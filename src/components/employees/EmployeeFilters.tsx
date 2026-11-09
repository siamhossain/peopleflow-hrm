"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FilterX,
  Plus,
  Search,
} from "lucide-react";

import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

import type { Employee, Department } from "@/types/employee";
import type { PaginatedEmployees } from "@/services/employeeService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";

interface EmployeeFiltersProps {
  initialEmployees: Employee[];
  isDemoViewer?: boolean;
}

const PAGE_SIZE = 10;

const EMPTY_RESULT: PaginatedEmployees = {
  data: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
};

export function EmployeeFilters({
  initialEmployees,
  isDemoViewer = false,
}: EmployeeFiltersProps) {
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
    if (isDemoViewer) {
      return;
    }

    setSelectedEmployee(null);
    setEditingEmployee(employee);
  };

  const handleDeactivateEmployee = async () => {
    if (isDemoViewer || !employeeToDeactivate || isDeactivating) {
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
    <div className="space-y-5">
      {/* Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Total Employees:{" "}
            <span className="font-semibold text-slate-900">{result.total}</span>
          </p>
        </div>

        {!isDemoViewer && (
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Employee
          </Button>
        )}
      </div>

      {/* Filter Card */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Input
              id="employee-search"
              type="search"
              label="Search Directory"
              value={search}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, code or designation..."
            />
          </div>

          <div>
            <Select
              id="employee-department"
              label="Department"
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              id="employee-status"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as Employee["status"] | "");
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="resigned">Resigned</option>
            </Select>
          </div>

          <div>
            <Select
              id="employee-sort"
              label="Sort By"
              value={`${sortBy}-${sortOrder}`}
              onChange={(event) => handleSortChange(event.target.value)}
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
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {isLoading
              ? "Updating employee directory..."
              : `Showing ${
                  result.total === 0
                    ? 0
                    : (result.page - 1) * result.pageSize + 1
                }–${Math.min(result.page * result.pageSize, result.total)} of ${
                  result.total
                } records`}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
            leftIcon={<FilterX className="h-3.5 w-3.5" />}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-2xs"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Employee Table */}
      <EmployeeTable
        employees={result.data}
        departments={departments}
        onView={setSelectedEmployee}
        onEdit={handleEditEmployee}
        onDeactivate={setEmployeeToDeactivate}
        readOnly={isDemoViewer}
      />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <Card className="p-0 overflow-hidden">
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            totalRecords={result.total}
            pageSize={result.pageSize}
            onPageChange={setPage}
          />
        </Card>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          departments={departments}
          onClose={() => setSelectedEmployee(null)}
          onEdit={handleEditEmployee}
          readOnly={isDemoViewer}
        />
      )}

      {/* Add / Edit Employee Modal */}
      {!isDemoViewer && (isCreateModalOpen || editingEmployee) && (
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

      {/* Deactivate Confirmation Modal */}
      {!isDemoViewer && employeeToDeactivate && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeactivating) setEmployeeToDeactivate(null);
          }}
          title="Deactivate Employee"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-slate-900">
                    {employeeToDeactivate.firstName}{" "}
                    {employeeToDeactivate.lastName}
                  </span>
                  ?
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  This employee will no longer have active status, but their
                  employment records, attendance, and leave history will be
                  safely preserved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEmployeeToDeactivate(null)}
                disabled={isDeactivating}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeactivating}
                onClick={() => void handleDeactivateEmployee()}
              >
                {isDeactivating ? "Deactivating..." : "Deactivate Employee"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
