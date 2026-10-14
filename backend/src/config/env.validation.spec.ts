import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation';

const required = {
  MONGODB_URI: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'a'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults for optional variables', () => {
    expect(validateEnv(required)).toEqual({
      ...required,
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_EXPIRES_IN_SECONDS: 900,
      CORS_ORIGIN: ['http://localhost:5173'],
    });
  });

  it('parses numbers and the comma-separated origin list', () => {
    const env = validateEnv({
      ...required,
      PORT: '4000',
      JWT_EXPIRES_IN_SECONDS: '3600',
      CORS_ORIGIN: 'https://a.example, https://b.example,',
    });

    expect(env.PORT).toBe(4000);
    expect(env.JWT_EXPIRES_IN_SECONDS).toBe(3600);
    expect(env.CORS_ORIGIN).toEqual(['https://a.example', 'https://b.example']);
  });

  it('reports every missing required variable at once', () => {
    expect(() => validateEnv({})).toThrow(
      /MONGODB_URI is required[\s\S]*JWT_SECRET is required/,
    );
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateEnv({ ...required, JWT_SECRET: 'short' })).toThrow(
      'JWT_SECRET must be at least 32 characters',
    );
  });

  it.each(['15m', '0', '-5', '1.5'])(
    'rejects JWT_EXPIRES_IN_SECONDS=%s',
    (value) => {
      expect(() =>
        validateEnv({ ...required, JWT_EXPIRES_IN_SECONDS: value }),
      ).toThrow('JWT_EXPIRES_IN_SECONDS must be a positive integer');
    },
  );
});
