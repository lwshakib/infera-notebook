-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "hasAudioPreview" BOOLEAN NOT NULL DEFAULT false;
