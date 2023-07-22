import userResolver from './userRosolver.js';

const resolvers = {
  Query: {
    getUser: userResolver.getUser,
    getUsers: userResolver.getUsers,
  },
  Mutation: {
    register: userResolver.register,
    login: userResolver.login,
    delete: userResolver.delete,
    updatePassword: userResolver.updatePassword,
    updateInfo: userResolver.updateInfo,
    // logout: () => {},
  },
};

export default resolvers;
