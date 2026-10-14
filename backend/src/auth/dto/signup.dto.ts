import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Trim } from './trim';

export class SignupDto {
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    {
      message:
        'Password must contain a letter, a number, and a special character',
    },
  )
  password: string;
}
