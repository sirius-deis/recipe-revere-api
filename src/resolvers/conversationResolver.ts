import { GraphQLError } from "graphql";
import Conversation, { IConversationType } from "src/models/conversation";
import { IUserType } from "src/models/user";
import authWrapper from "src/utils/auth";

const checkIfConversationExists = async (
  conversationId: string
): Promise<IConversationType> => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new GraphQLError("Conversation not found", {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    });
  }

  return conversation;
};

const checkIfUserHasRights = async (
  conversation: IConversationType,
  userId: string
) => {
  if (conversation.creatorId.equals(userId)) {
    throw new GraphQLError("You are not the creator of this conversation", {
      extensions: {
        code: "NOT_AUTHORIZED",
        http: { status: 401 },
      },
    });
  }
};

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

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserHasRights(conversation, user._id.toString());

      await conversation.deleteOne();

      return true;
    }
  ),
  changeConversationName: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; newName: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserHasRights(conversation, user._id.toString());

      return true;
    }
  ),
};

export default conversationResolver;
