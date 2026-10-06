-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roles" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicles" (
    "reg_no" TEXT NOT NULL,
    "vehicle_model" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "load_capacity" DOUBLE PRECISION NOT NULL,
    "odometer_reading" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Vehicles_pkey" PRIMARY KEY ("reg_no")
);

-- CreateTable
CREATE TABLE "Driver" (
    "license_no" TEXT NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "safety_score" DOUBLE PRECISION NOT NULL,
    "license_type" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("license_no")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" SERIAL NOT NULL,
    "reg_no" TEXT NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "dest" TEXT NOT NULL,
    "cargo_weight" DOUBLE PRECISION NOT NULL,
    "trip_dist" DOUBLE PRECISION NOT NULL,
    "trip_status" TEXT NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fuel_Logs" (
    "id" SERIAL NOT NULL,
    "reg_no" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "litres" DOUBLE PRECISION NOT NULL,
    "fuel_cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Fuel_Logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expenses" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "reg_no" TEXT NOT NULL,
    "maintenance" DOUBLE PRECISION NOT NULL,
    "toll" DOUBLE PRECISION NOT NULL,
    "others" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_role_key" ON "Roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driver_id_key" ON "Driver"("driver_id");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_reg_no_fkey" FOREIGN KEY ("reg_no") REFERENCES "Vehicles"("reg_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "Driver"("driver_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fuel_Logs" ADD CONSTRAINT "Fuel_Logs_reg_no_fkey" FOREIGN KEY ("reg_no") REFERENCES "Vehicles"("reg_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_reg_no_fkey" FOREIGN KEY ("reg_no") REFERENCES "Vehicles"("reg_no") ON DELETE RESTRICT ON UPDATE CASCADE;
