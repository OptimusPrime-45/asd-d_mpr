-- AlterTable
ALTER TABLE "Companies" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR (Rs)',
ADD COLUMN     "distance_unit" TEXT NOT NULL DEFAULT 'Kilometers';
