import dotenv from 'dotenv';
dotenv.config();
import User from '../models/user.js';
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const signToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
};

const resolvers = {
  Query: {
    getUser: async (id: string) => {},
    getUsers: async () => {},
  },
  Mutation: {
    register: async (_: any, { input }: any) => {
      const { email, password, passwordConfirm } = input;

      if (password !== passwordConfirm) {
        throw new GraphQLError('Passwords are not the same', {
          extensions: {
            code: 'PASSWORD_ARE_NOT_THE_SAME',
          },
        });
      }

      await User.create({ email, password });

      return true;
    },
    login: async (_: any, { input }: any) => {
      const { email, password } = input;

      const user = await User.findOne({ email });

      if (!user) {
        throw new GraphQLError('There is no such user', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }

      if (!user.isActive) {
        throw new GraphQLError('Your account is not activated', {
          extensions: {
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError('Password is incorrect', {
          extensions: {
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      const token = signToken(user._id.toString());

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pictures: user.pictures,
        token,
      };
    },
  },
};

export default resolvers;
