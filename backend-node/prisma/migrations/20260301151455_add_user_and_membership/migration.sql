/*
  Warnings:

  - You are about to drop the column `mobileReportId` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `MobileReport` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_mobileReportId_fkey";

-- DropIndex
DROP INDEX "Project_mobileReportId_key";

-- AlterTable
ALTER TABLE "MobileReport" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "mobileReportId";

-- CreateIndex
CREATE UNIQUE INDEX "MobileReport_projectId_key" ON "MobileReport"("projectId");

-- AddForeignKey
ALTER TABLE "MobileReport" ADD CONSTRAINT "MobileReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
