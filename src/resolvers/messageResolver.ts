import { GraphQLError } from "graphql";
import Conversation from "src/models/conversation";
import authWrapper from "src/utils/auth";

const messageResolver = {
  getMessages: authWrapper(async () => {
    return {};
  }),
};

export default messageResolver;
