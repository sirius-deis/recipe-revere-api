import dotenv from 'dotenv';
dotenv.config();
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import User, { IUser, IUserMethods, IUserModal } from '../models/user.js';

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const signToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });
};

interface IUserInput {
  input: {
    email: string;
    password: string;
    passwordConfirm?: string;
  };
}

type IUserCol = IUser & IUserMethods & IUserModal;

const USERS_PER_PAGE = 10;

const resolvers = {
  Query: {
    getUser: async (_: any, args: { userId: string }, context: { user: IUserCol }) => {
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
        email: context.user._id.equals(userId) ? user.email : undefined,
        role: context.user._id.equals(userId) ? user.role : undefined,
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
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          pictures: user.pictures,
        },
        token,
      };
    },
    delete: async (
      _: any,
      { input }: { input: { password: string } },
      context: { user: IUserCol },
    ) => {
      const { user } = context;

      const { password } = input;

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError('Password is incorrect', {
          extensions: {
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      await user.deleteOne();

      return true;
    },
    updatePassword: async (
      _: any,
      { input }: { input: { password: string; newPassword: string; newPasswordConfirm: string } },
      context: { user: IUserCol },
    ) => {
      const { user } = context;
      const { password, newPassword, newPasswordConfirm } = input;

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError('Password is incorrect', {
          extensions: {
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      if (!(await user.comparePasswords(newPassword))) {
        throw new GraphQLError('Passwords are the same', {
          extensions: {
            code: 'PASSWORD_ARE_THE_SAME',
          },
        });
      }

      if (newPassword !== newPasswordConfirm) {
        throw new GraphQLError('Passwords are not the same', {
          extensions: {
            code: 'PASSWORD_ARE_NOT_THE_SAME',
          },
        });
      }

      user.password = newPassword;

      const token = signToken(user._id.toString());

      await user.updateOne(
        { _id: user._id },
        { $set: { password: newPassword } },
        { runValidators: true },
      );

      return token;
    },
    // updateInfo: async () => {},
    // logout: () => {},
  },
};

export default resolvers;
