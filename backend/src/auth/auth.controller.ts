import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

const ONE_MINUTE = 60_000;

@ApiTags('auth')
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded.' })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { ttl: ONE_MINUTE, limit: 5 } })
  @ApiCreatedResponse({ description: 'Account created. Returns the new user.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiConflictResponse({ description: 'The email is already registered.' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: ONE_MINUTE, limit: 10 } })
  @ApiOkResponse({
    description:
      'Signed in. Returns `{ accessToken, tokenType, expiresIn, user }`.',
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Returns the user identified by the token.' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token.',
  })
  getProfile(@Request() req: { user: { userId: string; email: string } }) {
    return {
      message: 'Protected endpoint accessed successfully',
      user: req.user,
    };
  }
}
