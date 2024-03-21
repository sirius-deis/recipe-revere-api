import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import Conversation from "src/models/conversation";
import { IUserType } from "src/models/user";
import authWrapper from "src/utils/auth";
import {
  checkIfConversationExists,
  checkIfUserIsInConversation,
} from "src/utils/conversationUtils";

const messageResolver = {
  getMessages: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      return { messages: conversation.messages };
    }
  ),
  sendMessage: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; messageText: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, messageText } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      conversation.messages.push({
        _id: new mongoose.Types.ObjectId(),
        messageText,
        senderId: user._id,
      });

      return true;
    }
  ),
};

export default messageResolver;
