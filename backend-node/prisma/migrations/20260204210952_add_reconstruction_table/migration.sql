/*
  Warnings:

  - You are about to drop the column `metadataJson` on the `Reconstruction` table. All the data in the column will be lost.
  - You are about to drop the column `objS3Key` on the `Reconstruction` table. All the data in the column will be lost.
  - You are about to drop the column `objS3Url` on the `Reconstruction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,version]` on the table `Reconstruction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inputCount` to the `Reconstruction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inputS3Prefix` to the `Reconstruction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Reconstruction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `Reconstruction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reconstruction" DROP COLUMN "metadataJson",
DROP COLUMN "objS3Key",
DROP COLUMN "objS3Url",
ADD COLUMN     "inputCount" INTEGER NOT NULL,
ADD COLUMN     "inputS3Prefix" TEXT NOT NULL,
ADD COLUMN     "outputS3Prefix" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'UPLOADED';

-- CreateIndex
CREATE UNIQUE INDEX "Reconstruction_projectId_version_key" ON "Reconstruction"("projectId", "version");
