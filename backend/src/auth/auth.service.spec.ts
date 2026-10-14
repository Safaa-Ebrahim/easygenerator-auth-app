import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const PASSWORD = 'secret1!';

describe('AuthService', () => {
  let passwordHash: string;
  let usersService: {
    create: jest.Mock<UsersService['create']>;
    findByEmail: jest.Mock<(email: string) => Promise<unknown>>;
  };
  let jwtService: JwtService;
  let service: AuthService;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    usersService = { create: jest.fn(), findByEmail: jest.fn() };
    jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: { expiresIn: 600 },
    });
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService,
      new ConfigService({ JWT_EXPIRES_IN_SECONDS: '600' }),
    );
  });

  it('signs up through UsersService', async () => {
    const user = {
      id: 'user-id',
      name: 'Jane',
      email: 'jane@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersService.create.mockResolvedValue(user);

    await expect(
      service.signup({ name: 'Jane', email: 'jane@example.com', password: PASSWORD }),
    ).resolves.toEqual({ message: 'User registered successfully', user });
  });

  describe('signin', () => {
    const storedUser = () => ({
      _id: { toString: () => 'user-id' },
      name: 'Jane',
      email: 'jane@example.com',
      password: passwordHash,
    });

    it('returns a signed token, its lifetime and the public user', async () => {
      usersService.findByEmail.mockResolvedValue(storedUser());

      const result = await service.signin({
        email: 'jane@example.com',
        password: PASSWORD,
      });

      expect(result).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 600,
        user: { id: 'user-id', name: 'Jane', email: 'jane@example.com' },
      });

      const payload = await jwtService.verifyAsync<{
        sub: string;
        email: string;
        iat: number;
        exp: number;
      }>(result.accessToken);
      expect(payload).toMatchObject({ sub: 'user-id', email: 'jane@example.com' });
      // The token's real lifetime matches the expiresIn reported to the client.
      expect(payload.exp - payload.iat).toBe(result.expiresIn);
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(storedUser());

      await expect(
        service.signin({ email: 'jane@example.com', password: 'wrong1!x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email with the same error', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.signin({ email: 'nobody@example.com', password: PASSWORD }),
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
