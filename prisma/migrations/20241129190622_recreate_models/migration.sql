/*
  Warnings:

  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserFollows` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `first_name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserFollows" DROP CONSTRAINT "UserFollows_followerId_fkey";

-- DropForeignKey
ALTER TABLE "UserFollows" DROP CONSTRAINT "UserFollows_followingId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "picture",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "followers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "profile_image_url" TEXT;

-- DropTable
DROP TABLE "UserFollows";
