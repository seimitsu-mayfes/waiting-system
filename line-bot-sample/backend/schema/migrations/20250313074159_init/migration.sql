/*
  Warnings:

  - You are about to drop the column `previousUpdateAt` on the `CallNumber` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CallNumber" DROP COLUMN "previousUpdateAt";

-- CreateTable
CREATE TABLE "CallHistory" (
    "id" SERIAL NOT NULL,
    "callNumber" INTEGER NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallHistory_pkey" PRIMARY KEY ("id")
);
