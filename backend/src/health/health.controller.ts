import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Connection } from "mongoose";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({
    summary: "Health check",
    description: "Status aplikasi dan koneksi MongoDB.",
  })
  @ApiOkResponse({
    schema: {
      example: { status: "ok", mongo: "connected" },
    },
  })
  check() {
    return {
      status: "ok",
      mongo: this.connection.readyState === 1 ? "connected" : "disconnected",
    };
  }
}
