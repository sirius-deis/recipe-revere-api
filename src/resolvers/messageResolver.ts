import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import Conversation, {
  IConversationType,
  IMessage,
} from "../models/conversation.js";
import { IUserType } from "../models/user.js";
import authWrapper from "../utils/auth.js";
import {
  checkIfConversationExists,
  checkIfUserIsInConversation,
  checkIfUserHasRights,
} from "../utils/conversationUtils.js";

const checkIfMessageIsInConversation = async (
  conversation: IConversationType,
  messageId: string
): Promise<void | never> => {
  if (!conversation.messages.find((message) => message._id.equals(messageId))) {
    throw new GraphQLError("Message not found", {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    });
  }
};

const checkIfMessageBelongsToUser = async (
  message: IMessage,
  userId: string
): Promise<void | never> => {
  if (!message.senderId.equals(userId)) {
    throw new GraphQLError("It's not your message. You can't delete it", {
      extensions: {
        code: "NOT_AUTHORIZED",
        http: { status: 401 },
      },
    });
  }
};

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
  getMessage: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; messageId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, messageId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      await checkIfMessageIsInConversation(conversation, messageId);

      return { message: conversation.messages.find((message) => message._id.equals(messageId)) };
    }
  ),
  sendMessage: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          conversationId: string;
          messageText: string;
          parentMessageId: string;
        };
      },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, messageText, parentMessageId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      conversation.messages.push({
        _id: new mongoose.Types.ObjectId(),
        messageBody: messageText,
        senderId: user._id,
        parentMessageId,
        likes: [],
      });

      await conversation.save();

      return true;
    }
  ),
  deleteMessage: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; messageId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, messageId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      await checkIfMessageIsInConversation(conversation, messageId);

      const message = conversation.messages.find((message) =>
        message._id.equals(messageId)
      )!;

      if (!(await checkIfUserHasRights(conversation, user._id.toString()))) {
        await checkIfMessageBelongsToUser(message, user._id.toString());
      }

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { messages: messageId },
      });

      return true;
    }
  ),
  editMessage: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          conversationId: string;
          messageId: string;
          messageText: string;
        };
      },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, messageId, messageText } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      await checkIfMessageIsInConversation(conversation, messageId);

      const message = conversation.messages.find((message) =>
        message._id.equals(messageId)
      )!;

      await checkIfMessageBelongsToUser(message, user._id.toString());

      message.messageBody = messageText;

      await conversation.save();

      return true;
    }
  ),
  likeMessage: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          messageId: string;
          conversationId: string;
        };
      },
      { user }: { user: IUserType }
    ) => {
      const { messageId, conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserIsInConversation(conversation, user._id.toString());

      await checkIfMessageIsInConversation(conversation, messageId);

      const message = conversation.messages.find((message) =>
        message._id.equals(messageId)
      )!;

      const likeIndex = message.likes.findIndex((like) =>
        like.userId.equals(user._id)
      );

      if (likeIndex) {
        message.likes.splice(likeIndex, 1);
      } else {
        message.likes.push({
          userId: user._id,
        });
      }

      await conversation.save();

      return true;
    }
  ),
};

export default messageResolver;
