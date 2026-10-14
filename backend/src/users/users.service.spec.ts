import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';
import type { UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';

/** Minimal stand-in for the Mongoose model: `new Model(data)`, `save()` and `findOne()`. */
class FakeUserModel {
  static existing: unknown = null;
  static saveError: unknown = null;
  static saved: FakeUserModel[] = [];
  static findOne = jest.fn((filter: { email: string }) => {
    void filter;
    const query = {
      select: () => query,
      exec: () => Promise.resolve(FakeUserModel.existing),
    };
    return query;
  });

  _id = { toString: () => 'user-id' };
  createdAt = new Date('2026-01-01T00:00:00Z');
  updatedAt = new Date('2026-01-01T00:00:00Z');
  name!: string;
  email!: string;
  password!: string;

  constructor(data: { name: string; email: string; password: string }) {
    Object.assign(this, data);
  }

  save() {
    if (FakeUserModel.saveError) {
      return Promise.reject(FakeUserModel.saveError);
    }
    FakeUserModel.saved.push(this);
    return Promise.resolve(this);
  }
}

const input = { name: 'Jane', email: 'jane@example.com', password: 'secret1!' };

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    FakeUserModel.existing = null;
    FakeUserModel.saveError = null;
    FakeUserModel.saved = [];
    FakeUserModel.findOne.mockClear();
    service = new UsersService(FakeUserModel as unknown as Model<UserDocument>);
  });

  describe('create', () => {
    it('normalises the input, hashes the password and omits it from the result', async () => {
      const result = await service.create({
        name: '  Jane Doe ',
        email: ' Jane@Example.COM ',
        password: 'secret1!',
      });

      expect(FakeUserModel.findOne).toHaveBeenCalledWith({
        email: 'jane@example.com',
      });
      expect(result).toEqual({
        id: 'user-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('password');

      const [saved] = FakeUserModel.saved;
      expect(saved.password).not.toBe('secret1!');
      await expect(bcrypt.compare('secret1!', saved.password)).resolves.toBe(true);
    });

    it('rejects an email that is already registered', async () => {
      FakeUserModel.existing = { email: 'jane@example.com' };

      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
      expect(FakeUserModel.saved).toHaveLength(0);
    });

    it('maps a duplicate-key error from a concurrent sign-up to a conflict', async () => {
      FakeUserModel.saveError = Object.assign(new Error('E11000'), { code: 11000 });

      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows other save errors unchanged', async () => {
      const failure = new Error('connection lost');
      FakeUserModel.saveError = failure;

      await expect(service.create(input)).rejects.toBe(failure);
    });
  });

  describe('findByEmail', () => {
    it('looks the user up by the normalised email', async () => {
      FakeUserModel.existing = { email: 'jane@example.com' };

      await expect(service.findByEmail(' JANE@example.com ')).resolves.toEqual({
        email: 'jane@example.com',
      });
      expect(FakeUserModel.findOne).toHaveBeenCalledWith({
        email: 'jane@example.com',
      });
    });
  });
});
