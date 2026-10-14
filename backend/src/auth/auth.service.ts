import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Env } from '../config/env.validation';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

/**
 * Hash of a random value, with the same cost factor as real passwords. Signing
 * in with an unknown email still runs one bcrypt comparison against it, so the
 * response time does not reveal whether the email is registered.
 */
const DUMMY_PASSWORD_HASH =
  '$2b$12$Qo9BXKbZy49IkmwPwxrVlOolNQxcDQHMH0taCql2dPee1H8suomEu';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async signup(dto: SignupDto) {
    const user = await this.usersService.create(dto);
    this.logger.log(`User registered: ${user.id}`);

    return {
      message: 'User registered successfully',
      user,
    };
  }

  async signin(dto: SigninDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      // The email is deliberately not logged: it is personal data, and failed
      // attempts often contain passwords typed into the wrong field.
      this.logger.warn('Failed sign-in attempt');
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`User signed in: ${payload.sub}`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get('JWT_EXPIRES_IN_SECONDS', {
        infer: true,
      }),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  }
}
