/*
  Warnings:

  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `followers` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_image_url` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PostLike_postId_userId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "first_name",
DROP COLUMN "followers",
DROP COLUMN "last_name",
DROP COLUMN "profile_image_url",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "picture" TEXT;

-- CreateTable
CREATE TABLE "UserFollows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "UserFollows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFollows_followerId_followingId_key" ON "UserFollows"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "UserFollows" ADD CONSTRAINT "UserFollows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollows" ADD CONSTRAINT "UserFollows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
