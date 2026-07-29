import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Budi Santoso" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "budi@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "rahasia123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: "budi@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "rahasia123" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
