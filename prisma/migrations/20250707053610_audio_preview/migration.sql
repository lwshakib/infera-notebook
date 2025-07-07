/*
  Warnings:

  - You are about to drop the column `audioUrl` on the `Notebook` table. All the data in the column will be lost.
  - You are about to drop the column `hasAudioPreview` on the `Notebook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notebook" DROP COLUMN "audioUrl",
DROP COLUMN "hasAudioPreview",
ADD COLUMN     "audioOverView" JSONB;
