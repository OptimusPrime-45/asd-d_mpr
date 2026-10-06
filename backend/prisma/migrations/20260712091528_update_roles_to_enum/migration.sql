/*
  Warnings:

  - Changed the type of `role` on the `Roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'DRIVER', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST');

-- AlterTable
ALTER TABLE "Roles" DROP COLUMN "role",
ADD COLUMN     "role" "RoleType" NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "start_trip_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_role_key" ON "Roles"("role");
