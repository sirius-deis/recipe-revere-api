import { Schema, Model, model, Types } from "mongoose";

export interface IMessage {
  _id: Types.ObjectId;
  messageBody?: string | undefined;
  senderId: Types.ObjectId;
  parentMessageId?: string | undefined;
  createDate?: Date;
  isRead?: boolean;
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
      messageBody: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      parentMessageId: String,
      createDate: {
        type: Schema.Types.Date,
        default: Date.now(),
      },
      isRead: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

const Conversation = model<IConversation, ConversationModel>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
