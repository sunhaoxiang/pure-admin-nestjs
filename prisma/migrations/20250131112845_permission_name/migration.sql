/*
  Warnings:

  - Added the required column `name` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "name" VARCHAR(20) NOT NULL;
