/*
  Warnings:

  - Added the required column `picture` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "picture" TEXT NOT NULL;
