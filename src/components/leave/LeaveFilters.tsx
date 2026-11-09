"use client";

import { useMemo, useState } from "react";
import { FilterX } from "lucide-react";

import { employees } from "@/data/employees";
import { leaveTypes } from "@/data/leaveTypes";
import { LeaveRequestTable } from "@/components/leave/LeaveRequestTable";
import type { LeaveRequest } from "@/types/leave";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface LeaveFiltersProps {
  requests: LeaveRequest[];
  onView: (request: LeaveRequest) => void;
  onApprove: (request: LeaveRequest) => void;
  onReject: (request: LeaveRequest) => void;
  onCancel: (request: LeaveRequest) => void;
}

export function LeaveFilters({
  requests,
  onView,
  onApprove,
  onReject,
  onCancel,
}: LeaveFiltersProps) {
  const [status, setStatus] = useState<LeaveRequest["status"] | "">("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (status && request.status !== status) {
        return false;
      }

      if (leaveTypeId && request.leaveTypeId !== leaveTypeId) {
        return false;
      }

      if (employeeId && request.employeeId !== employeeId) {
        return false;
      }

      return true;
    });
  }, [requests, status, leaveTypeId, employeeId]);

  const hasFilters = Boolean(status || leaveTypeId || employeeId);

  const clearFilters = () => {
    setStatus("");
    setLeaveTypeId("");
    setEmployeeId("");
  };

  const handleView = (request: LeaveRequest) => {
    onView(request);
  };

  const handleApprove = (request: LeaveRequest) => {
    onApprove(request);
  };

  const handleReject = (request: LeaveRequest) => {
    onReject(request);
  };

  const handleCancel = (request: LeaveRequest) => {
    onCancel(request);
  };

  return (
    <div className="space-y-5">
      {/* Filters Toolbar Card */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Select
              id="leave-status"
              label="Leave Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as LeaveRequest["status"] | "")
              }
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div>
            <Select
              id="leave-type"
              label="Leave Category"
              value={leaveTypeId}
              onChange={(event) => setLeaveTypeId(event.target.value)}
            >
              <option value="">All Leave Types</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              id="leave-employee"
              label="Filter by Employee"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredRequests.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {requests.length}
            </span>{" "}
            leave applications
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

      {/* Table Card */}
      <Card className="overflow-hidden p-0">
        <LeaveRequestTable
          requests={filteredRequests}
          onView={handleView}
          onApprove={handleApprove}
          onReject={handleReject}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
}
