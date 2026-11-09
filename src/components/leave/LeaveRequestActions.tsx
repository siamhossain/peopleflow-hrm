"use client";

import type { LeaveRequest } from "@/types/leave";
import { Eye, Check, X, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LeaveRequestActionsProps {
  request: LeaveRequest;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function LeaveRequestActions({
  request,
  onView,
  onApprove,
  onReject,
  onCancel,
}: LeaveRequestActionsProps) {
  const isPending = request.status === "pending";
  const isApproved = request.status === "approved";

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onView}
        leftIcon={<Eye className="h-3.5 w-3.5" />}
        aria-label="View request details"
      >
        View
      </Button>

      {isPending && (
        <>
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={onApprove}
            leftIcon={<Check className="h-3.5 w-3.5" />}
          >
            Approve
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onReject}
            leftIcon={<X className="h-3.5 w-3.5" />}
          >
            Reject
          </Button>
        </>
      )}

      {isApproved && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          leftIcon={<Ban className="h-3.5 w-3.5 text-slate-400" />}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
