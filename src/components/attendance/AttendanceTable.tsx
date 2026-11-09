import type { AttendanceListItem } from "@/services/attendanceService";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarX, Clock } from "lucide-react";

interface AttendanceTableProps {
  records: AttendanceListItem[];
}

const statusBadgeVariants: Record<AttendanceListItem["status"], BadgeVariant> = {
  present: "success",
  late: "warning",
  half_day: "info",
  absent: "danger",
  leave: "purple",
  holiday: "neutral",
  weekend: "neutral",
};

const formatStatus = (status: AttendanceListItem["status"]) => {
  return status.replace("_", " ");
};

const formatWorkingTime = (minutes: number | null | undefined) => {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export function AttendanceTable({ records }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="No attendance records"
        description="No attendance entries were found for the selected month or department filter."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead>Working Time</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {records.map((record) => {
          const initials = record.employeeName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <TableRow key={record.id} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 select-none shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {record.employeeName}
                    </p>
                    <p className="font-mono text-xs text-slate-400 truncate">
                      {record.employeeId}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {record.department}
                </span>
              </TableCell>

              <TableCell className="text-xs text-slate-600 font-mono">
                {record.checkIn ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {record.checkIn}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>

              <TableCell className="text-xs text-slate-600 font-mono">
                {record.checkOut ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {record.checkOut}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>

              <TableCell className="text-xs font-medium text-slate-700">
                {record.workingMinutes ? (
                  <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 text-slate-700">
                    {formatWorkingTime(record.workingMinutes)}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>

              <TableCell className="text-right">
                <Badge variant={statusBadgeVariants[record.status]} dot>
                  {formatStatus(record.status)}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
