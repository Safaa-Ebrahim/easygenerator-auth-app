import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from './trim';

export class SignupDto {
  @ApiProperty({ example: 'Jane Doe', minLength: 3, maxLength: 100 })
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'jane@example.com', maxLength: 254 })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'secret1!',
    minLength: 8,
    maxLength: 72,
    description: 'At least one letter, one number and one special character.',
  })
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
