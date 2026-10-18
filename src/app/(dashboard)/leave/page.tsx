import { LeaveManagement } from "@/components/leave/LeaveManagement";
import { getLeaveRequests } from "@/services/leaveService";

export default async function LeavePage() {
  const requests = await getLeaveRequests();

  return (
    <section>
      <div>
        <p className="text-sm font-medium text-gray-500">Leave Management</p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Leave Requests
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Review and manage employee leave requests.
        </p>
      </div>

      <div className="mt-6">
        <LeaveManagement requests={requests} />
      </div>
    </section>
  );
}
