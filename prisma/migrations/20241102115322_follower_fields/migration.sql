/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserFollowers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserFollowing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "_UserFollowers" DROP CONSTRAINT "_UserFollowers_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserFollowers" DROP CONSTRAINT "_UserFollowers_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserFollowing" DROP CONSTRAINT "_UserFollowing_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserFollowing" DROP CONSTRAINT "_UserFollowing_B_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "_UserFollowers";

-- DropTable
DROP TABLE "_UserFollowing";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "profile_image_url" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
