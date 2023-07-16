import User from 'src/models/user';

const resolvers = {
  Query: {
    getUser: async (id: string) => {},
    getUsers: async () => {},
  },
  Mutation: {
    register: async (email: string, password: string, passwordConfirm: string) => {},
    login: async (email: string, password: string) => {},
  },
};

export default resolvers;
