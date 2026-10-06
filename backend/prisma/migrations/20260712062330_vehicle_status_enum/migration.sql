/*
  Warnings:

  - Changed the type of `status` on the `Vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');

-- AlterTable
ALTER TABLE "Vehicles" DROP COLUMN "status",
ADD COLUMN     "status" "VehicleStatus" NOT NULL;
