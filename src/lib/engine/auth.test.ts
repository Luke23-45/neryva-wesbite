import { describe, expect, it } from 'vitest';
import { isSafeReturnPath } from './auth';

describe('isSafeReturnPath', () => {
  it('accepts in-app paths with query strings', () => {
    expect(isSafeReturnPath('/platform')).toBe(true);
    expect(isSafeReturnPath('/agent-studio/chat?assistant=abc')).toBe(true);
    expect(isSafeReturnPath('/platform/auth/callback?code=x&state=y')).toBe(true);
    expect(isSafeReturnPath('/')).toBe(true);
  });

  it('rejects anything that could leave the app', () => {
    expect(isSafeReturnPath(null)).toBe(false);
    expect(isSafeReturnPath(undefined)).toBe(false);
    expect(isSafeReturnPath('')).toBe(false);
    expect(isSafeReturnPath('https://evil.test/phish')).toBe(false);
    expect(isSafeReturnPath('http://localhost:3001/health/live')).toBe(false);
    expect(isSafeReturnPath('//evil.test/platform')).toBe(false);
    expect(isSafeReturnPath('javascript:alert(1)')).toBe(false);
    expect(isSafeReturnPath('/\\evil.test')).toBe(false);
    expect(isSafeReturnPath('/platform\r\nSet-Cookie: x')).toBe(false);
  });
});
