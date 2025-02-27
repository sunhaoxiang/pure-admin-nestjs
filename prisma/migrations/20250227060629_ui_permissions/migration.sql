/*
  Warnings:

  - You are about to drop the column `buttonPermissions` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "buttonPermissions",
ADD COLUMN     "uiPermissions" TEXT[];
