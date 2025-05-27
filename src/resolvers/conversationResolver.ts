import { GraphQLError } from "graphql";
import Conversation, { IConversationType } from "../models/conversation.js";
import { IUserType } from "../models/user.js";
import authWrapper from "../utils/auth.js";
import {
  checkIfConversationExists,
  checkIfUserIsInConversation,
  checkIfUserHasRights,
} from "../utils/conversationUtils.js";

type QueryOptionsType = {
  name?: {};
  tags?: {};
};

const conversationResolver = {
  createConversation: authWrapper(
    async (
      _: any,
      {
        input,
      }: { input: { conversationName: string; conversationType: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationName, conversationType = "public" } = input;

      await Conversation.create({
        creatorId: user._id,
        name: conversationName,
        type: conversationType,
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
      const { conversationId, newName } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserHasRights(conversation, user._id.toString());

      conversation.name = newName;

      await conversation.save();

      return true;
    }
  ),
  addUsersToConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; usersId: string[] } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, usersId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserHasRights(conversation, user._id.toString());

      await Conversation.findByIdAndUpdate(conversationId, {
        $addToSet: { members: { $each: [usersId] } },
      });

      return true;
    }
  ),
  removeUserFromConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string; userId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId, userId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      await checkIfUserHasRights(conversation, user._id.toString());

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { members: userId },
      });
      return true;
    }
  ),
  getConversations: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: { query: string; page: number; limit: number; tags: string };
      }
    ) => {
      const { query, page = 1, limit = 10, tags } = input;

      const queryOptions: QueryOptionsType = {};

      if (query) {
        queryOptions.name = {
          $regex: query,
          $options: "i",
        };
      }

      if (tags) {
        queryOptions.tags = {
          $in: tags,
        };
      }

      const skip = limit * (page - 1);

      const [documentCount, conversations] = await Promise.all([
        Conversation.countDocuments(queryOptions),
        Conversation.find(queryOptions).skip(skip).limit(limit),
      ]);

      return { conversations, conversationsCount: documentCount };
    }
  ),
  getConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string } },
    ) => {
      const { conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      return conversation;
    }
  ),
  enterConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      checkIfUserIsInConversation(conversation, user._id.toString());

      if (conversation.publicity === "private") {
        await Conversation.findByIdAndUpdate(conversationId, {
          $addToSet: { requests: user._id },
        });
      } else {
        await Conversation.findByIdAndUpdate(conversationId, {
          $addToSet: { members: user._id },
        });
      }

      return true;
    }
  ),
  leaveConversation: authWrapper(
    async (
      _: any,
      { input }: { input: { conversationId: string } },
      { user }: { user: IUserType }
    ) => {
      const { conversationId } = input;

      const conversation = await checkIfConversationExists(conversationId);

      checkIfUserIsInConversation(conversation, user._id.toString(), false);

      await Conversation.findByIdAndUpdate(conversationId, {
        $pull: { members: user._id },
      });

      return true;
    }
  ),
};

export default conversationResolver;
