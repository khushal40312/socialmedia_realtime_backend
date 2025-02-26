/*
  Warnings:

  - You are about to drop the column `likes` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "likes";

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_postId_userId_key" ON "likes"("postId", "userId");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
