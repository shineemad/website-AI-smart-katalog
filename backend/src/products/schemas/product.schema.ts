import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: "" })
  imageUrl: string;

  @Prop({ type: Object, default: {} })
  specs: Record<string, unknown>;

  @Prop({ default: "default", index: true })
  tenantId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
