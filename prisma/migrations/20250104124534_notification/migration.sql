/*
  Warnings:

  - Added the required column `firstName` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postTitle` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "postTitle" TEXT NOT NULL;
