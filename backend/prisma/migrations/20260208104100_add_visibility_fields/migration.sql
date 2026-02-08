-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT;

-- CreateIndex
CREATE INDEX "Course_isPublic_idx" ON "Course"("isPublic");

-- CreateIndex
CREATE INDEX "Organization_isPublic_idx" ON "Organization"("isPublic");
