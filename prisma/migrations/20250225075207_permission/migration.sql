/*
  Warnings:

  - You are about to drop the `RoleApi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoleMenu` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleApi" DROP CONSTRAINT "RoleApi_apiId_fkey";

-- DropForeignKey
ALTER TABLE "RoleApi" DROP CONSTRAINT "RoleApi_roleId_fkey";

-- DropForeignKey
ALTER TABLE "RoleMenu" DROP CONSTRAINT "RoleMenu_menuId_fkey";

-- DropForeignKey
ALTER TABLE "RoleMenu" DROP CONSTRAINT "RoleMenu_roleId_fkey";

-- DropTable
DROP TABLE "RoleApi";

-- DropTable
DROP TABLE "RoleMenu";
