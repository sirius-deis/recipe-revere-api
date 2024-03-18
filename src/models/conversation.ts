import { Schema, Model, model, Types } from "mongoose";

interface IConversation {
  _id: Types.ObjectId;
  name: string;
  creator: Types.ObjectId;
  members: Types.ObjectId[];
}

type ConversationModel = Model<IConversation, {}>;

const ConversationSchema = new Schema<IConversation, ConversationModel>({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 256,
  },
  creator: {
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
});

const Conversation = model<IConversation, ConversationModel>(
  "Conversation",
  ConversationSchema
);

export default Conversation;
