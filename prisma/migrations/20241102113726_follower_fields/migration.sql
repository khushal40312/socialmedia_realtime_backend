/*
  Warnings:

  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_authorId_fkey";

-- DropTable
DROP TABLE "posts";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "profile_image_url" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserFollowing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UserFollowers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFollowing_AB_unique" ON "_UserFollowing"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFollowing_B_index" ON "_UserFollowing"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFollowers_AB_unique" ON "_UserFollowers"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFollowers_B_index" ON "_UserFollowers"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFollowing" ADD CONSTRAINT "_UserFollowing_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFollowing" ADD CONSTRAINT "_UserFollowing_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFollowers" ADD CONSTRAINT "_UserFollowers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFollowers" ADD CONSTRAINT "_UserFollowers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
