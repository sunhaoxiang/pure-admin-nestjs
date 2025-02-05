/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('DIRECTORY', 'ENDPOINT');

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "code" VARCHAR(20) NOT NULL,
ADD COLUMN     "description" VARCHAR(100);

-- DropTable
DROP TABLE "Permission";

-- DropTable
DROP TABLE "RolePermission";

-- CreateTable
CREATE TABLE "Api" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "type" "ResourceType" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "path" VARCHAR(100),
    "method" VARCHAR(10),
    "description" VARCHAR(100),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleApiAccess" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "apiId" INTEGER NOT NULL,

    CONSTRAINT "RoleApiAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Api_code_key" ON "Api"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoleApiAccess_roleId_apiId_key" ON "RoleApiAccess"("roleId", "apiId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- AddForeignKey
ALTER TABLE "Api" ADD CONSTRAINT "Api_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Api"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleApiAccess" ADD CONSTRAINT "RoleApiAccess_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleApiAccess" ADD CONSTRAINT "RoleApiAccess_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
