/*
  Warnings:

  - A unique constraint covering the columns `[projectId,version]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Input" DROP CONSTRAINT "Input_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'CREATED',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "EventSummary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "finalDisaster" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "summaryJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconstruction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "objS3Key" TEXT,
    "objS3Url" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reconstruction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSummary_projectId_key" ON "EventSummary"("projectId");

-- CreateIndex
CREATE INDEX "Reconstruction_projectId_idx" ON "Reconstruction"("projectId");

-- CreateIndex
CREATE INDEX "Input_projectId_idx" ON "Input"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_projectId_version_key" ON "Report"("projectId", "version");

-- AddForeignKey
ALTER TABLE "Input" ADD CONSTRAINT "Input_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSummary" ADD CONSTRAINT "EventSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconstruction" ADD CONSTRAINT "Reconstruction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
