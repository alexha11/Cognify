-- Track failed OTP submissions so a 6-digit verification code cannot be
-- brute-forced. The application destroys the record once this passes
-- OTP_MAX_ATTEMPTS.
ALTER TABLE "EmailVerification" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
