/**
 * Application-wide constants
 * Replaces magic numbers and strings scattered across the codebase.
 */

// ── Authentication ──
export const BCRYPT_SALT_ROUNDS = 12;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;
/**
 * Failed OTP submissions allowed before the code is destroyed. A 6-digit code
 * is only ~1M possibilities, so without this an attacker can simply enumerate.
 */
export const OTP_MAX_ATTEMPTS = 5;

/** Name of the HttpOnly cookie carrying the session JWT. */
export const AUTH_COOKIE_NAME = 'cognify_token';
/** Name of the short-lived signed cookie carrying the OAuth CSRF state. */
export const OAUTH_STATE_COOKIE_NAME = 'cognify_oauth_state';
/** OAuth state cookie lifetime — the user has this long to finish the Google flow. */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

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
