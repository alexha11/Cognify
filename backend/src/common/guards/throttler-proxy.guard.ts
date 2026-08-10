import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Rate-limit guard that identifies clients by their real IP.
 *
 * Client traffic reaches this API through the Next.js `/api/*` rewrite, so
 * `req.ip` is the *frontend server's* address — identical for every user. Left
 * as-is, one user hitting a limit would lock out everybody. We therefore prefer
 * the left-most `X-Forwarded-For` entry, which is the originating client.
 *
 * Caveat: `X-Forwarded-For` is client-spendable, so an attacker can rotate it
 * freely. IP throttling here is defence-in-depth for noisy abuse only — the
 * authoritative protection against targeted OTP brute force is the per-record
 * attempt counter on EmailVerification, which no header can bypass.
 */
@Injectable()
export class ThrottlerProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const forwarded = req.headers['x-forwarded-for'];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const clientIp = raw?.split(',')[0]?.trim();

    return Promise.resolve(clientIp || req.ip || 'unknown');
  }
}
