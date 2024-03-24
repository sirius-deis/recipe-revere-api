import userResolver from "./userResolver.js";
import recipeResolver from "./recipeResolver.js";
import conversationResolver from "./conversationResolver.js";
import messageResolver from "./messageResolver.js";

const resolvers = {
  Query: {
    getUser: userResolver.getUser,
    getUsers: userResolver.getUsers,
    logout: userResolver.logout,
    getRecipes: recipeResolver.getRecipes,
    getRecipe: recipeResolver.getRecipe,
    forgetPassword: userResolver.forgetPassword,
    getFavorites: recipeResolver.getFavorites,
    getConversations: conversationResolver.getConversations,
    getMessages: messageResolver.getMessages,
  },
  Mutation: {
    register: userResolver.register,
    login: userResolver.login,
    delete: userResolver.delete,
    updatePassword: userResolver.updatePassword,
    updateInfo: userResolver.updateInfo,
    forgetPassword: userResolver.forgetPassword,
    reviewRecipe: recipeResolver.reviewRecipe,
    removeReviewFromRecipe: recipeResolver.removeReviewFromRecipe,
    changeReview: recipeResolver.changeReview,
    report: recipeResolver.report,
    addToFavorite: recipeResolver.addToFavorite,
    sendRequestToFriends: userResolver.sendRequestToFriends,
    removeFromFriends: userResolver.removeFromFriends,
    processFriendRequest: userResolver.processFriendRequest,
    blockUser: userResolver.blockUser,
    unblockUser: userResolver.unblockUser,
    addToShoppingList: recipeResolver.addToShoppingList,
    createConversation: conversationResolver.createConversation,
    deleteConversation: conversationResolver.deleteConversation,
    changeConversationName: conversationResolver.changeConversationName,
    addUsersToConversation: conversationResolver.addUsersToConversation,
    removeUserFromConversation: conversationResolver.removeUserFromConversation,
    leaveConversation: conversationResolver.leaveConversation,
    enterConversation: conversationResolver.enterConversation,
    sendMessage: messageResolver.sendMessage,
    deleteMessage: messageResolver.deleteMessage,
    editMessage: messageResolver.editMessage,
    likeMessage: messageResolver.likeMessage,
  },
};

export default resolvers;
