-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "requiresCourseId" TEXT NOT NULL,

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoursePrerequisite_courseId_idx" ON "CoursePrerequisite"("courseId");

-- CreateIndex
CREATE INDEX "CoursePrerequisite_requiresCourseId_idx" ON "CoursePrerequisite"("requiresCourseId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrerequisite_courseId_requiresCourseId_key" ON "CoursePrerequisite"("courseId", "requiresCourseId");

-- CreateIndex
CREATE INDEX "CourseCompletion_userId_idx" ON "CourseCompletion"("userId");

-- CreateIndex
CREATE INDEX "CourseCompletion_courseId_idx" ON "CourseCompletion"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCompletion_userId_courseId_key" ON "CourseCompletion"("userId", "courseId");

-- CreateIndex
CREATE INDEX "RoleRequest_userId_idx" ON "RoleRequest"("userId");

-- CreateIndex
CREATE INDEX "RoleRequest_status_idx" ON "RoleRequest"("status");

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_requiresCourseId_fkey" FOREIGN KEY ("requiresCourseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCompletion" ADD CONSTRAINT "CourseCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseCompletion" ADD CONSTRAINT "CourseCompletion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
