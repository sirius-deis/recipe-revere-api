import { Schema, model, Types } from "mongoose";

interface IMessage {
  _id: Types.ObjectId;
  text: string;
  messageType: string;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  timestamp: Types.Decimal128;
  isRead: boolean;
}

const MessageSchema = new Schema<IMessage>({
  text: { type: String, required: true },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "audio"],
    required: true,
  },
  senderId: { type: Schema.Types.ObjectId, required: true },
  recipientId: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Types.Decimal128, default: Date.now },
  isRead: { type: Boolean, default: false},
})

const Message = model<IMessage>("Message", MessageSchema);

export default Message;