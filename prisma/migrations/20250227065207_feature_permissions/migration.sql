/*
  Warnings:

  - The values [UI] on the enum `MenuType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `uiPermissions` on the `Role` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MenuType_new" AS ENUM ('DIRECTORY', 'MENU', 'FEATURE');
ALTER TABLE "Menu" ALTER COLUMN "type" TYPE "MenuType_new" USING ("type"::text::"MenuType_new");
ALTER TYPE "MenuType" RENAME TO "MenuType_old";
ALTER TYPE "MenuType_new" RENAME TO "MenuType";
DROP TYPE "MenuType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "uiPermissions",
ADD COLUMN     "featurePermissions" TEXT[];
