import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({
    summary: "Registrasi user baru",
    description: "Membuat akun baru dengan role default buyer.",
  })
  @ApiCreatedResponse({
    schema: {
      example: {
        id: "6650f0c2e1a1a1a1a1a1a1a1",
        name: "Budi Santoso",
        email: "budi@example.com",
        role: "buyer",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validasi gagal / email sudah terdaftar",
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Login dan dapatkan JWT",
    description: "Mengembalikan Bearer token untuk endpoint yang diproteksi.",
  })
  @ApiOkResponse({
    schema: { example: { accessToken: "eyJhbGciOiJIUzI1NiIs..." } },
  })
  @ApiUnauthorizedResponse({ description: "Email atau password salah" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
