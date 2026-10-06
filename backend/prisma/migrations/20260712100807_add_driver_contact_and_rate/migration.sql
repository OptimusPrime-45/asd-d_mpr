-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "contact_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trip_completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0;
