
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

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
        'Password must contain at least one letter, one number, and one special character',
    },
  )
  password: string;
}
