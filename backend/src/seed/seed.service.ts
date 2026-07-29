import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import { Model } from "mongoose";
import { User, UserDocument, UserRole } from "../auth/schemas/user.schema";
import { Product, ProductDocument } from "../products/schemas/product.schema";
import { StorageService } from "../storage/storage.service";
import { SEED_PRODUCTS } from "./seed.data";

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly storage: StorageService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedAdmin();
      await this.seedProducts();
    } catch (err) {
      this.logger.error(`Seed gagal: ${(err as Error).message}`);
    }
  }

  private async seedAdmin() {
    const count = await this.userModel.countDocuments();
    if (count > 0) return;
    const email = process.env.ADMIN_EMAIL || "admin@smartcatalog.test";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    await this.userModel.create({
      name: "Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
    });
    this.logger.log(`Akun admin default dibuat: ${email}`);
  }

  private async seedProducts() {
    const count = await this.productModel.countDocuments();
    if (count > 0) return;
    for (const item of SEED_PRODUCTS) {
      let imageUrl = "";
      try {
        const svg = placeholderSvg(item.name, item.category);
        const uploaded = await this.storage.upload(
          Buffer.from(svg, "utf-8"),
          `${slug(item.name)}.svg`,
          "image/svg+xml",
        );
        imageUrl = uploaded.url;
      } catch (err) {
        this.logger.warn(
          `Upload placeholder gagal untuk ${item.name}: ${(err as Error).message}`,
        );
      }
      await this.productModel.create({ ...item, imageUrl });
    }
    this.logger.log(`${SEED_PRODUCTS.length} produk seed dibuat`);
  }
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const CATEGORY_COLORS: Record<string, string> = {
  Laptop: "#2563eb",
  Smartphone: "#7c3aed",
  Aksesoris: "#059669",
  Monitor: "#dc2626",
  Tablet: "#d97706",
};

function placeholderSvg(name: string, category: string) {
  const color = CATEGORY_COLORS[category] ?? "#334155";
  const short = name.length > 28 ? name.slice(0, 27) + "…" : name;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="${color}"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" rx="16"/>
  <text x="300" y="185" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="28" font-weight="700" fill="#fff">${short}</text>
  <text x="300" y="225" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="18" fill="rgba(255,255,255,.8)">${category}</text>
</svg>`;
}
