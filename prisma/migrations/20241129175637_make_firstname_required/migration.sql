/*
  Warnings:

  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "picture",
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "profile_image_url" TEXT;
