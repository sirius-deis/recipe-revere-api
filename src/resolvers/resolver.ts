import userResolver from './userResolver.js';
import recipeResolver from './recipeResolver.js';

const resolvers = {
  Query: {
    getUser: userResolver.getUser,
    getUsers: userResolver.getUsers,
    logout: userResolver.logout,
    getRecipes: recipeResolver.getRecipes,
    getRecipe: recipeResolver.getRecipe,
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
  },
};

export default resolvers;
