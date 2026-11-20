import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Picks the client address out of an X-Forwarded-For chain.
 *
 * Each proxy in front of the API appends the address it received the
 * connection from, so with `trustedHops` proxies of our own (the Next.js
 * rewrite counts as one) the real client is the entry `trustedHops` places
 * from the end. Anything to its left was supplied by the client and can be
 * forged, which is why the left-most entry must not be trusted.
 *
 * Without `trustedHops` the left-most entry is used, as before. That keeps
 * existing deployments working but is spoofable; set TRUSTED_PROXY_HOPS.
 */
export function resolveClientIp(
  forwardedFor: string | string[] | undefined,
  remoteAddress: string | undefined,
  trustedHops?: number,
): string {
  const header = Array.isArray(forwardedFor)
    ? forwardedFor.join(',')
    : (forwardedFor ?? '');
  const chain = header
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (chain.length === 0) {
    return remoteAddress || 'unknown';
  }

  if (trustedHops && trustedHops > 0) {
    return chain[Math.max(0, chain.length - trustedHops)];
  }

  return chain[0];
}

/**
 * Rate-limit guard that identifies clients by their real IP.
 *
 * Client traffic reaches this API through the Next.js `/api/*` rewrite, so the
 * socket address is the *frontend server's* — identical for every user. Left
 * as-is, one user hitting a limit would lock out everybody, so the client is
 * read from X-Forwarded-For (see `resolveClientIp`).
 *
 * The authoritative protections against brute force do not depend on IPs:
 * the per-code attempt counter and the per-address resend cooldown.
 */
@Injectable()
export class ThrottlerProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '', 10);

    return Promise.resolve(
      resolveClientIp(
        req.headers['x-forwarded-for'],
        req.socket?.remoteAddress ?? req.ip,
        Number.isFinite(hops) ? hops : undefined,
      ),
    );
  }
}
