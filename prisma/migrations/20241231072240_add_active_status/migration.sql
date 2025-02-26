-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActive" TIMESTAMP(3);
