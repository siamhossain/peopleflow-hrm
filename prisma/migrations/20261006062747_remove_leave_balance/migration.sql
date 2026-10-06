/*
  Warnings:

  - You are about to drop the `LeaveBalance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_leaveTypeId_fkey";

-- DropTable
DROP TABLE "LeaveBalance";
