import dotenv from 'dotenv';
dotenv.config();
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { IUser } from '../models/user.js';

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const signToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
};

export interface IUserInput {
  input: {
    email: string;
    password: string;
    passwordConfirm?: string;
  };
}

const USERS_PER_PAGE = 10;

const resolvers = {
  Query: {
    getUser: async (_: any, args: { userId: string }, context: { user: IUser }) => {
      const { userId } = args;
      const user = await User.findById(userId);

      if (!user) {
        throw new GraphQLError('There is no such user', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }

      return {
        id: user._id,
        name: user.name,
        email: user._id.equals(userId) ? user.email : undefined,
        role: user._id.equals(userId) ? user.role : undefined,
        pictures: user.pictures,
      };
    },
    getUsers: async (_: any, args: { page: number }) => {
      const { page } = args;
      const users = await User.find()
        .skip(USERS_PER_PAGE * (page - 1))
        .limit(USERS_PER_PAGE);

      if (users.length < 1) {
        throw new GraphQLError('There is no users left', {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }

      const usersAmount = await User.countDocuments();

      return {
        users,
        amount: usersAmount,
      };
    },
  },
  Mutation: {
    register: async (_: any, { input }: IUserInput) => {
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
    login: async (_: any, { input }: IUserInput) => {
      const { email, password } = input;
      console.log(email);
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
