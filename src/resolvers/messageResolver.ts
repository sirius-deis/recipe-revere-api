import { GraphQLError } from "graphql";
import Conversation from "src/models/conversation";
import { IUserType } from "src/models/user";
import authWrapper from "src/utils/auth";

const messageResolver = {
  getMessages: authWrapper(
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

      return {};
    }
  ),
};

export default messageResolver;
