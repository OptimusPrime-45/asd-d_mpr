-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('Routine_Service', 'Oil_Change', 'Tire_Replacement', 'Brake_Service', 'Engine_Repair', 'Other');

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "reg_no" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_reg_no_fkey" FOREIGN KEY ("reg_no") REFERENCES "Vehicles"("reg_no") ON DELETE RESTRICT ON UPDATE CASCADE;
