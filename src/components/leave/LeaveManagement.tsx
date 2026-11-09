"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";

import { LeaveFilters } from "@/components/leave/LeaveFilters";
import { LeaveRequestDetails } from "@/components/leave/LeaveRequestDetails";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import type { LeaveRequest } from "@/types/leave";
import { Button } from "@/components/ui/Button";

interface LeaveManagementProps {
  requests: LeaveRequest[];
}

type LeaveAction = "approve" | "reject" | "cancel";

export function LeaveManagement({
  requests: initialRequests,
}: LeaveManagementProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const refreshRequests = async () => {
    const response = await fetch("/api/leave/requests?all=true");
    const result = (await response.json()) as {
      data?: LeaveRequest[];
      message?: string;
    };

    if (!response.ok) {
      throw new Error(result.message ?? "Failed to refresh leave requests.");
    }

    const updatedRequests = result.data ?? [];
    setRequests(updatedRequests);

    return updatedRequests;
  };

  const handleView = (request: LeaveRequest) => {
    setSelectedRequest(request);
  };

  const handleAction = async (request: LeaveRequest, action: LeaveAction) => {
    setIsUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/leave/requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: request.id,
          action,
          reviewerId: "emp-006",
        }),
      });

      const result = (await response.json()) as {
        data?: LeaveRequest;
        message?: string;
      };

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "Failed to update leave request.");
      }

      const updatedRequests = await refreshRequests();
      const refreshedRequest =
        updatedRequests.find((item) => item.id === result.data?.id) ??
        result.data;

      setSelectedRequest(refreshedRequest);

      const messages: Record<LeaveAction, string> = {
        approve: "Leave request has been approved successfully.",
        reject: "Leave request has been rejected.",
        cancel: "Leave request has been cancelled.",
      };

      setSuccessMessage(messages[action]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the request.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateSuccess = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await refreshRequests();
      setShowCreateForm(false);
      setSuccessMessage("Leave application submitted successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Request created, but refreshing the list failed.",
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Messages */}
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

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-2xs"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          Total Applications:{" "}
          <span className="font-semibold text-slate-900">{requests.length}</span>
        </p>

        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setSuccessMessage("");
            setErrorMessage("");
            setShowCreateForm((prev) => !prev);
          }}
        >
          {showCreateForm ? "Close Form" : "Create Leave Request"}
        </Button>
      </div>

      {/* Conditional Create Request Form */}
      {showCreateForm && (
        <LeaveRequestForm
          onSuccess={() => {
            void handleCreateSuccess();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters and Table */}
      <LeaveFilters
        requests={requests}
        onView={handleView}
        onApprove={(request) => void handleAction(request, "approve")}
        onReject={(request) => void handleAction(request, "reject")}
        onCancel={(request) => void handleAction(request, "cancel")}
      />

      {/* Details Modal */}
      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {/* Updating indicator */}
      {isUpdating && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Updating leave request status...</span>
        </div>
      )}
    </div>
  );
}
