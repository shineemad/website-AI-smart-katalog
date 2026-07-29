import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProductsModule } from "../products/products.module";
import { SeedService } from "./seed.service";

@Module({
  imports: [AuthModule, ProductsModule],
  providers: [SeedService],
})
export class SeedModule {}
