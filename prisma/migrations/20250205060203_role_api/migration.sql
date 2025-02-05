/*
  Warnings:

  - You are about to drop the `RoleApiAccess` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleApiAccess" DROP CONSTRAINT "RoleApiAccess_apiId_fkey";

-- DropForeignKey
ALTER TABLE "RoleApiAccess" DROP CONSTRAINT "RoleApiAccess_roleId_fkey";

-- DropTable
DROP TABLE "RoleApiAccess";

-- CreateTable
CREATE TABLE "RoleApi" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "apiId" INTEGER NOT NULL,

    CONSTRAINT "RoleApi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleApi_roleId_apiId_key" ON "RoleApi"("roleId", "apiId");

-- CreateIndex
CREATE INDEX "Api_method_path_idx" ON "Api"("method", "path");

-- AddForeignKey
ALTER TABLE "RoleApi" ADD CONSTRAINT "RoleApi_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleApi" ADD CONSTRAINT "RoleApi_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
