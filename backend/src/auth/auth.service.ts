
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { getJwtExpiresInSeconds } from './jwt-expiry';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const user = await this.usersService.create(dto);

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async signin(dto: SigninDto) {
    const user = await this.usersService.findByEmail(
      dto.email,
    );

    if (
      !user ||
      !(await bcrypt.compare(dto.password, user.password))
    ) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: getJwtExpiresInSeconds(this.configService),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }
}
