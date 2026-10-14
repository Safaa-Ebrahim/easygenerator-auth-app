import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

// MongoDB's error code for a unique-index violation.
const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput) {
    const email = input.email.trim().toLowerCase();

    const existingUser = await this.userModel.findOne({ email }).exec();

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = new this.userModel({
      name: input.name.trim(),
      email,
      password: hashedPassword,
    });

    try {
      await user.save();
    } catch (error) {
      // Two concurrent sign-ups can both pass the check above; the unique
      // index then rejects the second one.
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+password')
      .exec();
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === DUPLICATE_KEY_ERROR
  );
}
