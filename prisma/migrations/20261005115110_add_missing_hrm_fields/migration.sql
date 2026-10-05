-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'WEEKEND';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "resignationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "allowHalfDay" BOOLEAN NOT NULL DEFAULT false;
