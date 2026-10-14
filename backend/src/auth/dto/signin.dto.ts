import { IsEmail, IsString, MaxLength } from 'class-validator';
import { Trim } from './trim';

export class SigninDto {
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}
