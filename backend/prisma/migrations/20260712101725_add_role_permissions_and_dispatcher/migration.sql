-- AlterEnum
ALTER TYPE "RoleType" ADD VALUE 'DISPATCHER';

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "resource" TEXT NOT NULL,
    "access" TEXT NOT NULL,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_role_id_resource_key" ON "RolePermissions"("role_id", "resource");

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
