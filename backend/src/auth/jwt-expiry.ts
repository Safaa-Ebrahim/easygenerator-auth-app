import { ConfigService } from '@nestjs/config';

const DEFAULT_JWT_EXPIRES_IN_SECONDS = 900;

/**
 * Access-token lifetime in seconds. The same value signs the token's `exp`
 * claim and is reported to the client as `expiresIn`, so the two never drift.
 */
export function getJwtExpiresInSeconds(configService: ConfigService): number {
  const raw = configService.get<string>('JWT_EXPIRES_IN_SECONDS');
  if (raw === undefined || raw === '') {
    return DEFAULT_JWT_EXPIRES_IN_SECONDS;
  }

  const seconds = Number(raw);
  if (!Number.isInteger(seconds) || seconds <= 0) {
    throw new Error(
      `JWT_EXPIRES_IN_SECONDS must be a positive integer, got "${raw}"`,
    );
  }
  return seconds;
}
