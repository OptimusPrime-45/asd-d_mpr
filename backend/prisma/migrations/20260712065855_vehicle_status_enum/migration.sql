/*
  Warnings:

  - Changed the type of `status` on the `Driver` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `trip_status` on the `Trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "status",
ADD COLUMN     "status" "DriverStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "trip_status",
ADD COLUMN     "trip_status" "TripStatus" NOT NULL;
