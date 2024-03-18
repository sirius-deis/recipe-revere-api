import { GraphQLError } from "graphql";
import Conversation from "src/models/conversation";
import { IUserType } from "src/models/user";
import authWrapper from "src/utils/auth";

const conversationResolver = {
  createConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationName: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationName } = input;

      await Conversation.create({
        creatorId: user._id,
        name: conversationName,
      });

      return true;
    }
  ),
};

export default conversationResolver;
