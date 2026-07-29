import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsModule } from "../products/products.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { OllamaClient } from "./ollama.client";
import { ChatLog, ChatLogSchema } from "./schemas/chat-log.schema";

@Module({
  imports: [
    ProductsModule,
    MongooseModule.forFeature([{ name: ChatLog.name, schema: ChatLogSchema }]),
  ],
  controllers: [AiController],
  providers: [AiService, OllamaClient],
})
export class AiModule {}
