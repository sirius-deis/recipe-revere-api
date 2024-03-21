import { GraphQLError } from "graphql";
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
};

export default messageResolver;
