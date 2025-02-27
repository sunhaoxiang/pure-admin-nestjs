/*
  Warnings:

  - The values [BUTTON] on the enum `MenuType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MenuType_new" AS ENUM ('DIRECTORY', 'MENU', 'UI');
ALTER TABLE "Menu" ALTER COLUMN "type" TYPE "MenuType_new" USING ("type"::text::"MenuType_new");
ALTER TYPE "MenuType" RENAME TO "MenuType_old";
ALTER TYPE "MenuType_new" RENAME TO "MenuType";
DROP TYPE "MenuType_old";
COMMIT;
