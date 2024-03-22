import { Schema, Model, model, Types } from "mongoose";

export interface IMessage {
  _id: Types.ObjectId;
  messageText: string;
  senderId: Types.ObjectId;
}

interface IConversation {
  _id: Types.ObjectId;
  name: string;
  creatorId: Types.ObjectId;
  publicity: string;
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
      sender_id: Schema.Types.ObjectId,
    },
  ],
});

const Conversation = model<IConversation, ConversationModel>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
