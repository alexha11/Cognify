-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "Material" ADD COLUMN "chunkCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MaterialChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(384),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "MaterialChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialChunk_materialId_idx" ON "MaterialChunk"("materialId");

-- CreateIndex (HNSW for cosine similarity search)
CREATE INDEX "MaterialChunk_embedding_idx" ON "MaterialChunk" USING hnsw (embedding vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "MaterialChunk" ADD CONSTRAINT "MaterialChunk_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
