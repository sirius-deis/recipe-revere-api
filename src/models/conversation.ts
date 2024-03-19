import { Schema, Model, model, Types } from "mongoose";

interface IMessage {
  _id: Types.ObjectId;
  messageTest: string;
  senderId: Types.ObjectId;
}

export interface IConversation {
  _id: Types.ObjectId;
  name: string;
  creatorId: Types.ObjectId;
  members: Types.ObjectId[];
  messages: IMessage[];
}

type ConversationModel = Model<IConversation, {}>;

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
