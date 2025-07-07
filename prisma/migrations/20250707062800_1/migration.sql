/*
  Warnings:

  - You are about to drop the column `audioOverView` on the `Notebook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notebook" DROP COLUMN "audioOverView",
ADD COLUMN     "audioOverview" JSONB;
