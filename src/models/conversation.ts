import { Schema, Model, model, Types } from "mongoose";

export interface IMessage {
  _id: Types.ObjectId;
  messageText: string;
  senderId: Types.ObjectId;
  parentMessageId: Types.ObjectId;
  createDate: Date;
}

interface IConversation {
  _id: Types.ObjectId;
  name: string;
  creatorId: Types.ObjectId;
  publicity: "public" | "private";
  type: "private" | "group";
  requests: Types.ObjectId[];
  members: Types.ObjectId[];
  messages: IMessage[];
}

interface IConversationMethods {
  deleteOne: () => Promise<IConversation | never>;
  save: () => Promise<never>;
}

type ConversationModel = Model<IConversation, {}, IConversationMethods>;

export type IConversationType = IConversation & IConversationMethods;

const ConversationSchema = new Schema<IConversation, ConversationModel>({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 256,
    unique: true,
    trim: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  publicity: {
    type: String,
    required: true,
    enum: ["private", "public"],
  },
  type: {
    type: String,
    enum: ["private", "group"],
    default: "private",
  },
  requests: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [
    {
      message_text: String,
      sender_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      parentMessageId: Schema.Types.ObjectId,
      createDate: {
        type: Schema.Types.Date,
        default: Date.now(),
      },
    },
  ],
});

const Conversation = model<IConversation, ConversationModel>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
