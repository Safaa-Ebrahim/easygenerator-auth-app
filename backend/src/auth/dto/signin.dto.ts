
import {
  IsEmail,
  IsString,
  MaxLength,
} from 'class-validator';

export class SigninDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(72)
  password: string;
}
