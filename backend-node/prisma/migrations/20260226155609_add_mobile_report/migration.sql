-- CreateTable
CREATE TABLE "MobileReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "originalName" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "disasterType" TEXT,
    "severityLevel" TEXT,
    "confidence" DOUBLE PRECISION,
    "analysisJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "mobileReportId" TEXT NOT NULL,
    "authorityType" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "voiceStatus" TEXT,
    "smsStatus" TEXT,
    "emailStatus" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MobileReport_projectId_idx" ON "MobileReport"("projectId");

-- CreateIndex
CREATE INDEX "MobileReport_status_idx" ON "MobileReport"("status");

-- CreateIndex
CREATE INDEX "AlertLog_mobileReportId_idx" ON "AlertLog"("mobileReportId");

-- AddForeignKey
ALTER TABLE "MobileReport" ADD CONSTRAINT "MobileReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_mobileReportId_fkey" FOREIGN KEY ("mobileReportId") REFERENCES "MobileReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
