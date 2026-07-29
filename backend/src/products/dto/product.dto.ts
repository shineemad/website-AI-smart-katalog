import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

/** specs dikirim sebagai JSON string pada multipart/form-data. */
const parseSpecs = ({ value }: { value: unknown }) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value; // biarkan validator menolak
  }
};

export class CreateProductDto {
  @ApiProperty({ example: "Laptop Acer Swift 3" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Laptop" })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 10500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: "Spesifikasi teknis dalam JSON (string pada multipart)",
    example: {
      processor: "Intel Core i7-13th Gen",
      ram: "16GB DDR5",
      storage: "512GB NVMe SSD",
    },
  })
  @Transform(parseSpecs)
  @IsNotEmpty()
  specs: Record<string, unknown>;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "Foto produk (png/jpeg, max 5MB)",
  })
  @IsOptional()
  image?: unknown;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class QueryProductsDto {
  @ApiPropertyOptional({ example: "Laptop" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
