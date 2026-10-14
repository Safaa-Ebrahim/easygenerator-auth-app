import { IsEmail, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from './trim';

export class SigninDto {
  @ApiProperty({ example: 'jane@example.com' })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'secret1!' })
  @IsString()
  @MaxLength(72)
  password: string;
}
