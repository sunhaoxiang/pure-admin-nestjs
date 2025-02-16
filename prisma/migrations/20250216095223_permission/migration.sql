/*
  Warnings:

  - You are about to drop the column `name` on the `Api` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `Api` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Api` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updateTime` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('DIRECTORY', 'MENU', 'BUTTON');

-- CreateEnum
CREATE TYPE "ApiType" AS ENUM ('DIRECTORY', 'API');

-- DropIndex
DROP INDEX "Api_method_path_idx";

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "name",
ADD COLUMN     "title" VARCHAR(50) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ApiType" NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updateTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RoleApi" ADD COLUMN     "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "ResourceType";

-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "type" "MenuType" NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "path" VARCHAR(100),
    "description" VARCHAR(100),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenu" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Menu_code_key" ON "Menu"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RoleMenu_roleId_menuId_key" ON "RoleMenu"("roleId", "menuId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMenu" ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
