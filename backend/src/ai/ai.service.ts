import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { Product, ProductDocument } from "../products/schemas/product.schema";
import { OllamaClient } from "./ollama.client";
import { buildProductChatPrompt, buildSearchPrompt } from "./prompt.builder";
import { ChatLog, ChatLogDocument } from "./schemas/chat-log.schema";

const MAX_CANDIDATES = 10;

@Injectable()
export class AiService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(ChatLog.name)
    private readonly chatLogModel: Model<ChatLogDocument>,
    private readonly ollama: OllamaClient,
  ) {}

  /** Modul 2: chat kontekstual pada halaman detail produk. */
  async chatWithProduct(productId: string, message: string) {
    const product = isValidObjectId(productId)
      ? await this.productModel.findById(productId).lean()
      : null;
    if (!product) throw new NotFoundException("Product not found");

    const prompt = buildProductChatPrompt(product, message);
    const reply = await this.ollama.generate(prompt);
    await this.chatLogModel.create({ productId, question: message, reply });
    return { success: true, productId, reply };
  }

  /** Modul 3: global smart advisory search. */
  async smartSearch(query: string) {
    const candidates = await this.findCandidates(query);
    if (candidates.length === 0) {
      return {
        success: true,
        reply:
          "Maaf, belum ada produk di katalog yang cocok dengan kebutuhan Anda. Coba kata kunci lain.",
        products: [],
      };
    }
    const prompt = buildSearchPrompt(candidates, query);
    const reply = await this.ollama.generate(prompt);
    await this.chatLogModel.create({ question: query, reply });
    return { success: true, reply, products: candidates };
  }

  /** Filter kandidat sederhana: regex kata pada nama/kategori + parsing harga "under X juta". */
  private async findCandidates(query: string) {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    const or: Record<string, unknown>[] = words.flatMap((w) => [
      { name: { $regex: w, $options: "i" } },
      { category: { $regex: w, $options: "i" } },
    ]);

    const priceCap = extractPriceCap(query);
    const filter: Record<string, unknown> = {};
    if (or.length > 0) filter.$or = or;
    if (priceCap) filter.price = { $lte: priceCap };

    let candidates = await this.productModel
      .find(filter)
      .limit(MAX_CANDIDATES)
      .lean();

    // Fallback: bila tidak ada match kata kunci, ambil semua (dgn batas harga bila ada)
    if (candidates.length === 0) {
      candidates = await this.productModel
        .find(priceCap ? { price: { $lte: priceCap } } : {})
        .limit(MAX_CANDIDATES)
        .lean();
    }
    return candidates;
  }
}

/** Deteksi "under 10 juta", "dibawah 5jt", "budget 15 juta" → angka rupiah. */
export function extractPriceCap(query: string): number | null {
  const m = query
    .toLowerCase()
    .match(
      /(?:under|di ?bawah|budget|maks(?:imal)?|<)\s*(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(juta|jt)/i,
    );
  if (!m) return null;
  return Math.round(parseFloat(m[1].replace(",", ".")) * 1_000_000);
}
