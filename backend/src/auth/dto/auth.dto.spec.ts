import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SigninDto } from './signin.dto';
import { SignupDto } from './signup.dto';

const valid = { name: 'Jane', email: 'jane@example.com', password: 'secret1!' };

async function validateSignup(input: Record<string, unknown>) {
  const dto = plainToInstance(SignupDto, input);
  const errors = await validate(dto);
  return { dto, fields: errors.map((error) => error.property) };
}

describe('SignupDto', () => {
  it('accepts a valid sign-up', async () => {
    expect((await validateSignup(valid)).fields).toEqual([]);
  });

  it('trims name and email before validating them', async () => {
    const { dto, fields } = await validateSignup({
      ...valid,
      name: '  Jane  ',
      email: ' jane@example.com ',
    });

    expect(fields).toEqual([]);
    expect(dto.name).toBe('Jane');
    expect(dto.email).toBe('jane@example.com');
  });

  it.each([
    ['too short once trimmed', '  ab  '],
    ['only whitespace', '     '],
  ])('rejects a name that is %s', async (_case, name) => {
    expect((await validateSignup({ ...valid, name })).fields).toEqual(['name']);
  });

  it.each([
    ['shorter than 8 characters', 'ab1!'],
    ['missing a letter', '12345678!'],
    ['missing a number', 'abcdefgh!'],
    ['missing a special character', 'abcdefg1'],
  ])('rejects a password %s', async (_case, password) => {
    expect((await validateSignup({ ...valid, password })).fields).toEqual([
      'password',
    ]);
  });

  it('does not trim the password', async () => {
    const { dto } = await validateSignup({ ...valid, password: ' secret1! ' });
    expect(dto.password).toBe(' secret1! ');
  });
});

describe('SigninDto', () => {
  it('trims the email', async () => {
    const dto = plainToInstance(SigninDto, {
      email: ' jane@example.com ',
      password: 'x',
    });

    expect(await validate(dto)).toEqual([]);
    expect(dto.email).toBe('jane@example.com');
  });
});
