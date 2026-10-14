import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { userId: string; email: string } }) {
    return {
      message: 'Protected endpoint accessed successfully',
      user: req.user,
    };
  }

}
