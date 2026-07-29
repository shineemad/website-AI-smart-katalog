import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1", { exclude: ["api/docs"] });
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle("SmartCatalog AI - API Documentation")
    .setDescription(
      "RESTful API spec untuk Katalog Produk, MinIO Upload, dan Integration AI Ollama",
    )
    .setVersion("1.0")
    .addTag("Auth")
    .addTag("Products")
    .addTag("AI Assistant")
    .addTag("Health")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger UI available on http://localhost:${port}/api/docs`);
}
bootstrap();
