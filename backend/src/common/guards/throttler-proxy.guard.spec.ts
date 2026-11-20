import { resolveClientIp } from './throttler-proxy.guard';

describe('resolveClientIp', () => {
  it('falls back to the socket address without X-Forwarded-For', () => {
    expect(resolveClientIp(undefined, '10.0.0.5')).toBe('10.0.0.5');
    expect(resolveClientIp('', undefined)).toBe('unknown');
  });

  it('uses the left-most entry when no proxy hops are configured (legacy)', () => {
    expect(resolveClientIp('1.1.1.1, 2.2.2.2', '10.0.0.5')).toBe('1.1.1.1');
  });

  it('ignores client-supplied entries once proxy hops are configured', () => {
    // The client forged "1.1.1.1"; our single proxy appended the real address.
    expect(resolveClientIp('1.1.1.1, 203.0.113.9', '10.0.0.5', 1)).toBe(
      '203.0.113.9',
    );
    // Edge proxy + Next.js proxy: the real client is two from the end.
    expect(
      resolveClientIp('1.1.1.1, 203.0.113.9, 10.1.1.1', '10.0.0.5', 2),
    ).toBe('203.0.113.9');
  });

  it('uses the first entry when the chain is shorter than the hop count', () => {
    expect(resolveClientIp('203.0.113.9', '10.0.0.5', 3)).toBe('203.0.113.9');
  });

  it('accepts the header as an array', () => {
    expect(resolveClientIp(['1.1.1.1', '203.0.113.9'], undefined, 1)).toBe(
      '203.0.113.9',
    );
  });
});
