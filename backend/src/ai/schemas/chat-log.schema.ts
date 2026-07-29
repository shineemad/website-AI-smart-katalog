import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ChatLogDocument = HydratedDocument<ChatLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ChatLog {
  @Prop()
  productId?: string;

  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  reply: string;
}

export const ChatLogSchema = SchemaFactory.createForClass(ChatLog);
