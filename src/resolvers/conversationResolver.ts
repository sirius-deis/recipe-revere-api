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
  deleteConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId } = input;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new GraphQLError("Conversation not found", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      if (conversation.creatorId.equals(user._id)) {
        throw new GraphQLError("You are not the creator of this conversation", {
          extensions: {
            code: "NOT_AUTHORIZED",
            http: { status: 401 },
          },
        });
      }

      await conversation.deleteOne();

      return true;
    }
  ),
};

export default conversationResolver;
