"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { Department, Employee } from "@/types/employee";

type EditableEmployee = Employee & {
  phone?: string | null;
};

interface EmployeeFormProps {
  departments: Department[];
  employee?: EditableEmployee;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
}

const EMPTY_FORM: EmployeeFormData = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  departmentId: "",
  designation: "",
  joiningDate: "",
};

function getInitialForm(employee?: EditableEmployee): EmployeeFormData {
  if (!employee) {
    return EMPTY_FORM;
  }

  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? "",
    departmentId: employee.departmentId,
    designation: employee.designation,
    joiningDate: employee.joiningDate.slice(0, 10),
  };
}

export function EmployeeForm({
  departments,
  employee,
  onClose,
  onSuccess,
}: EmployeeFormProps) {
  const isEditing = Boolean(employee);

  const [formData, setFormData] = useState<EmployeeFormData>(() =>
    getInitialForm(employee),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    try {
      if (isEditing && !employee) {
        throw new Error("Employee information is missing.");
      }

      const response = await fetch(
        employee ? `/api/employees/${employee.id}` : "/api/employees",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            phone: formData.phone.trim() || undefined,
          }),
        },
      );

      const payload = (await response.json()) as {
        data?: unknown;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.message ??
            `Failed to ${isEditing ? "update" : "create"} employee.`,
        );
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100";

  const labelClassName = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2
              id="employee-form-title"
              className="text-lg font-semibold text-gray-900"
            >
              {isEditing ? "Edit Employee" : "Add New Employee"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "Update the employee's information below."
                : "Enter the employee's information below."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close form"
            className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="employeeCode" className={labelClassName}>
                Employee Code *
              </label>

              <input
                id="employeeCode"
                name="employeeCode"
                value={formData.employeeCode}
                onChange={handleChange}
                required
                maxLength={30}
                placeholder="EMP-001"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="joiningDate" className={labelClassName}>
                Joining Date *
              </label>

              <input
                id="joiningDate"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
                required
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="firstName" className={labelClassName}>
                First Name *
              </label>

              <input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="First name"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="lastName" className={labelClassName}>
                Last Name *
              </label>

              <input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Last name"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClassName}>
                Email Address *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="employee@example.com"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClassName}>
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="departmentId" className={labelClassName}>
                Department *
              </label>

              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className={inputClassName}
              >
                <option value="">Select department</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="designation" className={labelClassName}>
                Designation *
              </label>

              <input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="e.g. Software Engineer"
                className={inputClassName}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || departments.length === 0}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
