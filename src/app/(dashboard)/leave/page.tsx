import { LeaveManagement } from "@/components/leave/LeaveManagement";
import { getLeaveRequests } from "@/services/leaveService";

export default async function LeavePage() {
  const requests = await getLeaveRequests();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Time-Off Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Leave Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review, approve, or reject employee leave applications, monitor allowance quotas, and record absences.
          </p>
        </div>
      </div>

      <LeaveManagement requests={requests} />
    </div>
  );
}
