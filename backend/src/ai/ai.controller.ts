import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { AiService } from "./ai.service";

export class ChatMessageDto {
  @ApiProperty({
    example:
      "Apakah laptop ini kuat dipakai running Docker dan kompilasi Next.js bersamaan?",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

export class SmartSearchDto {
  @ApiProperty({ example: "Laptop under 10 juta yang cocok buat rendering 3D" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;
}

// 5 request per menit per IP untuk endpoint AI (lindungi Ollama kampus)
const AI_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@ApiTags("AI Assistant")
@Controller()
@UseGuards(ThrottlerGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("products/:id/chat")
  @Throttle(AI_THROTTLE)
  @ApiOperation({
    summary: "Kirim pertanyaan AI khusus untuk konteks produk tertentu",
    description:
      "Backend mengambil data produk dari MongoDB sebagai konteks, lalu meneruskan ke Ollama API.",
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        productId: "6650f0c2e1a1a1a1a1a1a1a1",
        reply:
          "Berdasarkan spesifikasi RAM 16GB DDR5 dan Processor Intel i7-13th Gen pada laptop ini, sistem sangat sanggup untuk menjalankan Docker container dan kompilasi Next.js secara bersamaan tanpa kendala berarti.",
      },
    },
  })
  @ApiNotFoundResponse({
    schema: { example: { message: "Product not found" } },
  })
  @ApiTooManyRequestsResponse({ description: "Rate limit 5 request/menit" })
  @ApiInternalServerErrorResponse({
    schema: { example: { message: "Ollama API error or unreachable" } },
  })
  chat(@Param("id") id: string, @Body() dto: ChatMessageDto) {
    return this.aiService.chatWithProduct(id, dto.message);
  }

  @Post("ai/search")
  @Throttle(AI_THROTTLE)
  @ApiOperation({
    summary: "Global Smart Advisory Search",
    description:
      "AI merekomendasikan produk terbaik dari katalog berdasarkan kebutuhan user dalam bahasa sehari-hari.",
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        reply:
          "Saya merekomendasikan Laptop Acer Swift 3 karena RAM 16GB dan prosesor i7 cocok untuk rendering 3D dengan budget di bawah 10 juta.",
        products: [],
      },
    },
  })
  @ApiTooManyRequestsResponse({ description: "Rate limit 5 request/menit" })
  @ApiInternalServerErrorResponse({
    schema: { example: { message: "Ollama API error or unreachable" } },
  })
  search(@Body() dto: SmartSearchDto) {
    return this.aiService.smartSearch(dto.query);
  }
}
