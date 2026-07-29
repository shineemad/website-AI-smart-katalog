import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, isValidObjectId } from "mongoose";
import { StorageService } from "../storage/storage.service";
import {
  CreateProductDto,
  QueryProductsDto,
  UpdateProductDto,
} from "./dto/product.dto";
import { Product, ProductDocument } from "./schemas/product.schema";

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function buildProductFilter(
  query: QueryProductsDto,
): FilterQuery<Product> {
  const filter: FilterQuery<Product> = {};
  if (query.category) {
    filter.category = { $regex: `^${query.category}$`, $options: "i" };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }
  return filter;
}

export function validateImage(file?: Express.Multer.File) {
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new BadRequestException(
      "Tipe file tidak didukung (hanya image/png atau image/jpeg)",
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new BadRequestException("Ukuran file maksimal 5MB");
  }
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly storage: StorageService,
  ) {}

  async findAll(query: QueryProductsDto) {
    const filter = buildProductFilter(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const product = isValidObjectId(id)
      ? await this.productModel.findById(id).lean()
      : null;
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: CreateProductDto, file?: Express.Multer.File) {
    validateImage(file);
    let imageUrl = "";
    if (file) {
      const uploaded = await this.storage.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      imageUrl = uploaded.url;
    }
    return this.productModel.create({
      name: dto.name,
      category: dto.category,
      price: dto.price,
      specs: dto.specs,
      imageUrl,
    });
  }

  async update(id: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    validateImage(file);
    const product = isValidObjectId(id)
      ? await this.productModel.findById(id)
      : null;
    if (!product) throw new NotFoundException("Product not found");

    if (file) {
      if (product.imageUrl) await this.storage.delete(product.imageUrl);
      const uploaded = await this.storage.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      product.imageUrl = uploaded.url;
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.specs !== undefined)
      product.specs = dto.specs as Record<string, unknown>;
    return product.save();
  }

  async remove(id: string) {
    const product = isValidObjectId(id)
      ? await this.productModel.findByIdAndDelete(id)
      : null;
    if (!product) throw new NotFoundException("Product not found");
    if (product.imageUrl) await this.storage.delete(product.imageUrl);
    return { success: true, message: "Produk dihapus" };
  }
}
