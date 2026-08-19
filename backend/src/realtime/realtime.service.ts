import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ChangeStream } from "mongodb";
import { Connection } from "mongoose";
import { Observable, Subject } from "rxjs";
import { CacheService } from "../cache/cache.service";

export interface ProductChangeEvent {
  type: string; // insert | update | replace | delete
  id: string;
  product: Record<string, unknown> | null;
  at: string;
}

/** Menyiarkan perubahan koleksi products via MongoDB Change Streams (butuh replica set). */
@Injectable()
export class RealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly events$ = new Subject<ProductChangeEvent>();
  private changeStream?: ChangeStream;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cache: CacheService,
  ) {}

  onModuleInit() {
    this.changeStream = this.connection
      .collection("products")
      .watch([], { fullDocument: "updateLookup" });

    this.changeStream.on("change", (change) => {
      void this.handleChange(change as Record<string, any>);
    });
    this.changeStream.on("error", (err) => {
      this.logger.warn(`Change stream error: ${err.message}`);
    });
    this.logger.log("Change stream koleksi products aktif");
  }

  private async handleChange(change: Record<string, any>) {
    // Invalidasi cache di sini menjamin konsistensi bahkan untuk tulis langsung ke DB.
    await this.cache.delByPrefix("products:");
    this.events$.next({
      type: change.operationType,
      id: String(change.documentKey?._id ?? ""),
      product: change.fullDocument ?? null,
      at: new Date().toISOString(),
    });
  }

  get stream(): Observable<ProductChangeEvent> {
    return this.events$.asObservable();
  }

  onModuleDestroy() {
    void this.changeStream?.close();
  }
}
