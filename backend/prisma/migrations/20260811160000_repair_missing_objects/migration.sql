-- Repairs schema objects that are missing from databases which were created
-- with `prisma db push` rather than by running the migration history.
--
-- Three things had drifted out of the live database:
--   * MaterialChunk       — the pgvector table backing uploads and RAG lookup.
--                           It was only ever created by raw-SQL migrations, and
--                           was absent from schema.prisma, so `db push` could
--                           not create it. Uploads failed with 42P01.
--   * Material.chunkCount — added alongside it by the same migration.
--   * EmailVerification.attempts
--                         — the OTP brute-force counter. Present in
--                           schema.prisma but never applied here, which
--                           silently disabled the attempt cap.
--
-- Every statement is additive and idempotent, so this is safe to re-run and
-- safe against a database that already has some of these objects. Nothing here
-- drops, updates or deletes.

CREATE EXTENSION IF NOT EXISTS "vector";

-- MaterialChunk. vector(512) matches EmbeddingService.dimensions; changing one
-- without the other makes every insert fail on dimension mismatch.
CREATE TABLE IF NOT EXISTS "MaterialChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "MaterialChunk_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MaterialChunk_materialId_fkey'
  ) THEN
    ALTER TABLE "MaterialChunk" ADD CONSTRAINT "MaterialChunk_materialId_fkey"
      FOREIGN KEY ("materialId") REFERENCES "Material"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MaterialChunk_materialId_idx"
  ON "MaterialChunk"("materialId");

-- HNSW over cosine distance, matching the `<=>` operator used by RagService.
CREATE INDEX IF NOT EXISTS "MaterialChunk_embedding_idx"
  ON "MaterialChunk" USING hnsw (embedding vector_cosine_ops);

ALTER TABLE "Material"
  ADD COLUMN IF NOT EXISTS "chunkCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "EmailVerification"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
