-- Ensure pgvector extension exists
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create MaterialChunk table if it doesn't exist (with new 512 dimension)
CREATE TABLE IF NOT EXISTS "MaterialChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "MaterialChunk_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MaterialChunk_materialId_fkey'
  ) THEN
    ALTER TABLE "MaterialChunk" ADD CONSTRAINT "MaterialChunk_materialId_fkey"
      FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "MaterialChunk_materialId_idx" ON "MaterialChunk"("materialId");

-- Drop and recreate the HNSW index (in case dimension changed)
DROP INDEX IF EXISTS "MaterialChunk_embedding_idx";

-- If the table already exists with a different vector dimension, alter it
DO $$
DECLARE
  current_dim integer;
BEGIN
  SELECT atttypmod INTO current_dim
  FROM pg_attribute
  WHERE attrelid = '"MaterialChunk"'::regclass AND attname = 'embedding';
  
  IF current_dim IS NOT NULL AND current_dim != 512 THEN
    UPDATE "MaterialChunk" SET "embedding" = NULL;
    ALTER TABLE "MaterialChunk" ALTER COLUMN "embedding" TYPE vector(512);
  END IF;
END $$;

-- Recreate HNSW index
CREATE INDEX "MaterialChunk_embedding_idx" ON "MaterialChunk" USING hnsw (embedding vector_cosine_ops);

-- Add chunkCount column to Material if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Material' AND column_name = 'chunkCount'
  ) THEN
    ALTER TABLE "Material" ADD COLUMN "chunkCount" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;
