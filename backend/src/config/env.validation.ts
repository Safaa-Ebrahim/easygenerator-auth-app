export interface Env {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  /** Access-token lifetime in seconds. */
  JWT_EXPIRES_IN_SECONDS: number;
  CORS_ORIGIN: string[];
}

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Validates and normalises the environment once at startup (passed to
 * `ConfigModule.forRoot({ validate })`), so a bad value stops the app with a
 * clear message instead of failing later at request time.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];

  const required = (name: string): string => {
    const value = readString(raw, name);
    if (!value) {
      errors.push(`${name} is required`);
    }
    return value ?? '';
  };

  const positiveInteger = (name: string, fallback: number): number => {
    const value = readString(raw, name);
    if (!value) {
      return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.push(`${name} must be a positive integer, got "${value}"`);
    }
    return parsed;
  };

  const env: Env = {
    NODE_ENV: readString(raw, 'NODE_ENV') || 'development',
    PORT: positiveInteger('PORT', 3000),
    MONGODB_URI: required('MONGODB_URI'),
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN_SECONDS: positiveInteger('JWT_EXPIRES_IN_SECONDS', 900),
    CORS_ORIGIN: (readString(raw, 'CORS_ORIGIN') || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };

  if (env.JWT_SECRET && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`,
    );
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment:\n- ${errors.join('\n- ')}`);
  }
  return env;
}

function readString(
  raw: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = raw[name];
  return typeof value === 'string' ? value.trim() : undefined;
}
