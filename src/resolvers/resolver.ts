import userResolver from './userRosolver.js';

const resolvers = {
  Query: {
    getUser: userResolver.getUser,
    getUsers: userResolver.getUsers,
    logout: userResolver.logout,
  },
  Mutation: {
    register: userResolver.register,
    login: userResolver.login,
    delete: userResolver.delete,
    updatePassword: userResolver.updatePassword,
    updateInfo: userResolver.updateInfo,
  },
};

export default resolvers;
