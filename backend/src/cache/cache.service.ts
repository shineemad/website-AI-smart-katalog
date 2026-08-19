import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/** Cache-aside berbasis Redis; degradasi mulus jika Redis mati. */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private ready = false;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.client.on("ready", () => {
      this.ready = true;
      this.logger.log("Redis terhubung");
    });
    this.client.on("error", (err) => {
      if (this.ready) this.logger.warn(`Redis error: ${err.message}`);
      this.ready = false;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.ready) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.ready) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      /* cache miss lebih baik daripada request gagal */
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.ready) return;
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.client.scan(
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          100,
        );
        cursor = next;
        if (keys.length) await this.client.del(...keys);
      } while (cursor !== "0");
    } catch {
      /* abaikan; TTL akan membersihkan sisa key */
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
