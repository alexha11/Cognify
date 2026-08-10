/**
 * Application-wide constants
 * Replaces magic numbers and strings scattered across the codebase.
 */

// ── Authentication ──
export const BCRYPT_SALT_ROUNDS = 12;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;

// ── File Upload Limits ──
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── AI Generation ──
export const AI_MAX_TOKENS = 4000;
export const AI_TEMPERATURE = 0.7;
export const AI_DEFAULT_QUESTION_COUNT = 5;

// ── Embeddings ──
export const EMBEDDING_BATCH_SIZE = 100;
export const EMBEDDING_DIMENSIONS = 512;

// ── Leaderboard ──
export const LEADERBOARD_TOP_N = 50;

// ── Prisma Select Patterns ──
/** Reusable Prisma select for user identity (creator/uploader). */
export const USER_SUMMARY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

/** Minimum text length for a meaningful PDF extraction. */
export const MIN_PDF_TEXT_LENGTH = 50;

/** Minimum chunk length to keep (too-short chunks are noisy). */
export const MIN_CHUNK_LENGTH = 20;
