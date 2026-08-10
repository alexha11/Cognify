import { randomBytes, timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_MS,
} from '../../../common/constants';

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (err: Error | null, ok: boolean, state?: unknown) => void;

/**
 * CSRF protection for the Google OAuth flow, backed by a signed cookie instead
 * of a server-side session.
 *
 * Without a `state` parameter, nothing ties the callback to the browser that
 * started the flow: an attacker can begin a Google login, capture the resulting
 * callback URL, and trick a victim into visiting it — silently signing the
 * victim into the *attacker's* account (login CSRF). Any work the victim then
 * does lands in an account the attacker controls.
 *
 * A cookie store is used rather than `express-session` so the backend stays
 * stateless and scales horizontally without a shared session store.
 *
 * NOTE ON ARITY: passport-oauth2 selects how to call these methods by reading
 * `Function.length` (see strategy.js). `store` must therefore take exactly 3
 * declared parameters and `verify` exactly 4 — do not add optional parameters
 * or defaults, which would silently change `.length` and break the flow. This
 * is also why the class does not `implements StateStore`: those typings model
 * the variants as overloads, which cannot express a fixed arity.
 */
export class CookieStateStore {
  private readonly isProduction: boolean;

  constructor(isProduction: boolean) {
    this.isProduction = isProduction;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction,
      // `lax` (not `strict`) is required: the cookie must survive the
      // top-level cross-site GET that Google uses to return the user here.
      sameSite: 'lax' as const,
      signed: true,
      path: '/',
      maxAge: OAUTH_STATE_TTL_MS,
    };
  }

  /** Called when the flow starts; issues the state and stores it in a cookie. */
  store(req: Request, meta: unknown, callback: StoreCallback): void {
    try {
      const state = randomBytes(32).toString('hex');
      const res = req.res as Response;

      res.cookie(OAUTH_STATE_COOKIE_NAME, state, this.cookieOptions());
      callback(null, state);
    } catch (err) {
      callback(err as Error);
    }
  }

  /** Called on the callback leg; the returned state must match the cookie. */
  verify(
    req: Request,
    providedState: string,
    meta: unknown,
    callback: VerifyCallback,
  ): void {
    try {
      // Read from signedCookies: an unsigned cookie is attacker-writable, which
      // would let them supply a matching pair and defeat the whole check.
      const storedState = req.signedCookies?.[OAUTH_STATE_COOKIE_NAME] as
        | string
        | undefined;

      const res = req.res as Response;
      // Single-use: clear it whatever the outcome so a captured callback URL
      // cannot be replayed.
      res.clearCookie(OAUTH_STATE_COOKIE_NAME, { path: '/' });

      if (!storedState || !providedState) {
        callback(null, false, 'Missing OAuth state.');
        return;
      }

      const a = Buffer.from(storedState, 'utf8');
      const b = Buffer.from(providedState, 'utf8');

      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        callback(null, false, 'Invalid OAuth state.');
        return;
      }

      callback(null, true, providedState);
    } catch (err) {
      callback(err as Error, false);
    }
  }
}
