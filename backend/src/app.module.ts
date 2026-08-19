import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { AiModule } from "./ai/ai.module";
import { StorageModule } from "./storage/storage.module";
import { SeedModule } from "./seed/seed.module";
import { HealthModule } from "./health/health.module";
import { CacheModule } from "./cache/cache.module";
import { RealtimeModule } from "./realtime/realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      // directConnection: tulis/baca via primary; replikasi ke secondary ditangani rs0.
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/smartcatalog?directConnection=true",
    ),
    // Rate limit hanya diterapkan pada endpoint AI via @Throttle decorator;
    // default global dibuat longgar.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60000, limit: 120 }]),
    CacheModule,
    HealthModule,
    AuthModule,
    StorageModule,
    ProductsModule,
    AiModule,
    SeedModule,
    RealtimeModule,
  ],
})
export class AppModule {}
