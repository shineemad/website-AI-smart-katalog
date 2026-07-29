import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import {
  CreateProductDto,
  QueryProductsDto,
  UpdateProductDto,
} from "./dto/product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: "Ambil semua daftar produk",
    description:
      "Mendukung filter category, minPrice, maxPrice serta pagination page & limit.",
  })
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            _id: "6650f0c2e1a1a1a1a1a1a1a1",
            name: "Laptop Acer Swift 3",
            category: "Laptop",
            price: 10500000,
            imageUrl: "http://localhost:9000/products/acer-swift-3.jpg",
            specs: {
              processor: "Intel Core i7-13th Gen",
              ram: "16GB DDR5",
              storage: "512GB NVMe SSD",
            },
          },
        ],
        meta: { total: 12, page: 1, limit: 12 },
      },
    },
  })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Ambil detail 1 produk berdasarkan ID" })
  @ApiOkResponse({ description: "Single Product Object JSON" })
  @ApiNotFoundResponse({
    schema: { example: { message: "Product not found" } },
  })
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("image"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Tambah produk baru (Upload Gambar ke MinIO + Data ke MongoDB)",
    description: "Khusus admin. Gambar png/jpeg max 5MB disimpan ke MinIO.",
  })
  @ApiCreatedResponse({
    description: "Created Product Object with imageUrl from MinIO",
  })
  @ApiBadRequestResponse({ description: "Validasi field/file gagal" })
  @ApiUnauthorizedResponse({ description: "Token tidak ada / tidak valid" })
  @ApiForbiddenResponse({ description: "Bukan admin" })
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.create(dto, file);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("image"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Update produk (data dan/atau ganti gambar)" })
  @ApiOkResponse({ description: "Updated Product Object" })
  @ApiNotFoundResponse({
    schema: { example: { message: "Product not found" } },
  })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.productsService.update(id, dto, file);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Hapus produk (termasuk objek gambar di MinIO)" })
  @ApiOkResponse({
    schema: { example: { success: true, message: "Produk dihapus" } },
  })
  @ApiNotFoundResponse({
    schema: { example: { message: "Product not found" } },
  })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
