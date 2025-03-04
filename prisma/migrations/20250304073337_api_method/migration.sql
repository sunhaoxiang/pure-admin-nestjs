/*
  Warnings:

  - The `method` column on the `Api` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApiMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- AlterTable
ALTER TABLE "Api" DROP COLUMN "method",
ADD COLUMN     "method" "ApiMethod";
