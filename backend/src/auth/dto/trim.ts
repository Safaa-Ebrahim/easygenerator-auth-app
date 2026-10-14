import { Transform } from 'class-transformer';

/**
 * Trims string input before validation runs, so length rules apply to the
 * value that is actually stored. Non-strings pass through for the type
 * validators to reject.
 */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
