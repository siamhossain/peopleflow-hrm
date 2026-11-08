export type AttendanceStatus =
  | "present"
  | "late"
  | "half_day"
  | "absent"
  | "leave"
  | "holiday"
  | "weekend";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingMinutes?: number;
  lateMinutes?: number;
}

export interface AttendanceListItem extends AttendanceRecord {
  employeeName: string;
  department: string;
}

export interface PaginatedAttendance {
  data: AttendanceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AttendanceSettings {
  officeStartTime: string;
  officeEndTime: string;
  lateThresholdMinutes: number;
  workingDays: number[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
}
