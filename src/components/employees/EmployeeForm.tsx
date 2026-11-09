"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { AlertCircle } from "lucide-react";

import type { Department, Employee } from "@/types/employee";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? "Edit Employee" : "Add New Employee"}
      description={
        isEditing
          ? "Update the employee's personal and organizational details."
          : "Provide the employee's information to register them in the system."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="employeeCode"
            name="employeeCode"
            label="Employee Code"
            value={formData.employeeCode}
            onChange={handleChange}
            required
            maxLength={30}
            placeholder="EMP-001"
          />

          <Input
            id="joiningDate"
            name="joiningDate"
            label="Joining Date"
            type="date"
            value={formData.joiningDate}
            onChange={handleChange}
            required
          />

          <Input
            id="firstName"
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g. John"
          />

          <Input
            id="lastName"
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g. Doe"
          />

          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="john.doe@example.com"
          />

          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
          />

          <Select
            id="departmentId"
            name="departmentId"
            label="Department"
            value={formData.departmentId}
            onChange={handleChange}
            required
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>

          <Input
            id="designation"
            name="designation"
            label="Designation"
            value={formData.designation}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g. Senior Software Engineer"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || departments.length === 0}
          >
            {isEditing ? "Save Changes" : "Create Employee"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
