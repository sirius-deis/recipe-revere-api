import { GraphQLError } from "graphql";
import Conversation, { IConversationType } from "../models/conversation.js";

export const checkIfConversationExists = async (
  conversationId: string
): Promise<IConversationType | never> => {
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

export const checkIfUserIsInConversation = async (
  conversation: IConversationType,
  userId: string,
  truthy: boolean = true
): Promise<void | never> => {
  if (
    truthy &&
    conversation.members.find((member) => member._id.equals(userId))
  ) {
    throw new GraphQLError("You are already in this conversation", {
      extensions: {
        code: "NOT_AUTHORIZED",
        http: { status: 401 },
      },
    });
  } else if (conversation.members.find((member) => member._id.equals(userId))) {
    throw new GraphQLError("You are not in this conversation", {
      extensions: {
        code: "NOT_AUTHORIZED",
        http: { status: 401 },
      },
    });
  }
};

export const checkIfUserHasRights = async (
  conversation: IConversationType,
  userId: string
): Promise<boolean | never> => {
  if (conversation.creatorId.equals(userId)) {
    throw new GraphQLError("You are not the creator of this conversation", {
      extensions: {
        code: "NOT_AUTHORIZED",
        http: { status: 401 },
      },
    });
  }
  return true;
};
