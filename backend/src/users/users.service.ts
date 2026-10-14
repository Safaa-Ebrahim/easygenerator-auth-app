
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.userModel
      .findOne({ email })
      .exec();

    if (existingUser) {
      throw new ConflictException(
        'Email is already registered',
      );
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      12,
    );

    const user = new this.userModel({
      name: createUserDto.name.trim(),
      email,
      password: hashedPassword,
    });

    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll() {
    return this.userModel
      .find()
      .select('-password')
      .exec();
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .exec();
  }

  async findById(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
