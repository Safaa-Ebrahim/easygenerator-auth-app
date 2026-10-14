import { describe, expect, it } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { getJwtExpiresInSeconds } from './jwt-expiry';

const expiryFor = (value?: string) =>
  getJwtExpiresInSeconds(
    new ConfigService(value === undefined ? {} : { JWT_EXPIRES_IN_SECONDS: value }),
  );

describe('getJwtExpiresInSeconds', () => {
  it('defaults to 15 minutes', () => {
    expect(expiryFor()).toBe(900);
    expect(expiryFor('')).toBe(900);
  });

  it('reads the configured number of seconds', () => {
    expect(expiryFor('3600')).toBe(3600);
  });

  it.each(['15m', '0', '-5', '1.5'])('rejects %s', (value) => {
    expect(() => expiryFor(value)).toThrow('JWT_EXPIRES_IN_SECONDS');
  });
});
