/*
  Warnings:

  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.
  - Made the column `firstName` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "picture",
ALTER COLUMN "firstName" SET NOT NULL;
