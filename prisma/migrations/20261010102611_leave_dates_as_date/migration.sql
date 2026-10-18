-- Preserve the intended Bangladesh calendar dates when converting
-- existing UTC timestamps to PostgreSQL DATE columns.
ALTER TABLE "LeaveRequest"
  ALTER COLUMN "startDate" TYPE DATE
    USING ("startDate" AT TIME ZONE 'Asia/Dhaka')::DATE,
  ALTER COLUMN "endDate" TYPE DATE
    USING ("endDate" AT TIME ZONE 'Asia/Dhaka')::DATE;