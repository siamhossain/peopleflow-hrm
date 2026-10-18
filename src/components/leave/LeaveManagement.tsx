"use client";

import { useState } from "react";

import { LeaveFilters } from "@/components/leave/LeaveFilters";
import { LeaveRequestDetails } from "@/components/leave/LeaveRequestDetails";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import type { LeaveRequest } from "@/types/leave";

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
        approve: "Leave request approved successfully.",
        reject: "Leave request rejected successfully.",
        cancel: "Leave request cancelled successfully.",
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
      setSuccessMessage("Leave request created successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Request created, but refreshing the list failed.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="font-medium text-green-700 hover:text-green-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setSuccessMessage("");
            setErrorMessage("");
            setShowCreateForm(true);
          }}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create Leave Request
        </button>
      </div>

      {showCreateForm && (
        <LeaveRequestForm
          onSuccess={() => {
            void handleCreateSuccess();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <LeaveFilters
        requests={requests}
        onView={handleView}
        onApprove={(request) => void handleAction(request, "approve")}
        onReject={(request) => void handleAction(request, "reject")}
        onCancel={(request) => void handleAction(request, "cancel")}
      />

      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {isUpdating && (
        <p role="status" className="text-sm text-gray-500">
          Updating leave request...
        </p>
      )}
    </div>
  );
}
