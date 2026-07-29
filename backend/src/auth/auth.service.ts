import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { User, UserDocument, UserRole } from "./schemas/user.schema";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException("Email sudah terdaftar");
    }
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: UserRole.BUYER,
    });
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Email atau password salah");
    }
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return { accessToken: await this.jwtService.signAsync(payload) };
  }
}
