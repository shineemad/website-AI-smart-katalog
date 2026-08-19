import { Controller, Sse } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { map } from "rxjs";
import { RealtimeService } from "./realtime.service";

@ApiTags("Realtime")
@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Sse("products")
  @ApiOperation({
    summary: "SSE stream perubahan produk (insert/update/delete) secara real-time",
  })
  products() {
    return this.realtime.stream.pipe(map((event) => ({ data: event })));
  }
}
