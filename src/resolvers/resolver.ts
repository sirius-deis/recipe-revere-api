import User from '../models/user.js';

const resolvers = {
  Query: {
    getUser: async (id: string) => {},
    getUsers: async () => {},
  },
  Mutation: {
    register: async (_: any, { input }: any) => {
      const { email, password, passwordConfirm } = input;

      if (password !== passwordConfirm) {
        throw new Error('Passwords are not the same');
      }

      await User.create({ email, password });

      return true;
    },
    login: async (email: string, password: string) => {},
  },
};

export default resolvers;
