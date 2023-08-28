import { GraphQLError } from 'graphql';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUserType } from '../models/user.js';
import authWrapper from '../utils/auth.js';
import { setValue } from '../db/redisConnection.js';
import Token from '../models/token.js';
import sendEmail from '../api/email.js';
import crypto from 'crypto';

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const signToken = (userId: string, expiresIn: string = JWT_EXPIRES_IN!) => {
  return jwt.sign({ userId }, JWT_SECRET!, { expiresIn });
};

interface IUserInput {
  email: string;
  password: string;
  passwordConfirm?: string;
}

const generateToken = () => crypto.randomBytes(32).toString('hex');

const USERS_PER_PAGE = 10;

const userResolver = {
  getUser: authWrapper(async (_: any, args: { userId: string }, context: { user: IUserType }) => {
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
  }),
  getUsers: authWrapper(async (_: any, args: { page: number }) => {
    const { page = 1 } = args;
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
  }),
  register: async (_: any, { input }: { input: IUserInput }) => {
    const { email, password, passwordConfirm } = input;

    if (password !== passwordConfirm) {
      throw new GraphQLError('Passwords are not the same', {
        extensions: {
          code: 'PASSWORD_ARE_NOT_THE_SAME',
        },
      });
    }

    const user = await User.create({ email, password });

    const token = generateToken();

    await Token.create({ userId: user._id, token });

    await sendEmail(email, 'Activate your account', 'verification', {
      link: `/users/activate/${token}`,
      title: 'Activate your account',
    });

    return true;
  },
  login: async (_: any, { input }: { input: IUserInput }, context: { res: Response }) => {
    const { email, password } = input;
    const { res } = context;
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

    const refreshToken = signToken(user._id.toString(), '90d');
    res.cookie('refresh-token', refreshToken);

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
  delete: authWrapper(
    async (
      _: any,
      { input }: { input: { password: string } },
      context: { user: IUserType; res: Response },
    ) => {
      const { user, res } = context;

      const { password } = input;

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError('Password is incorrect', {
          extensions: {
            code: 'AUTHENTICATION_FAILED',
          },
        });
      }

      await user.deleteOne();

      res.clearCookie('refresh-token');

      return true;
    },
  ),
  updatePassword: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          password: string;
          newPassword: string;
          newPasswordConfirm: string;
        };
      },
      context: { user: IUserType },
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

      if (await user.comparePasswords(newPassword)) {
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

      await user.save();

      return token;
    },
  ),
  updateInfo: authWrapper(
    async (_: any, { input }: { input: { name: string } }, context: { user: IUserType }) => {
      const { user } = context;
      const { name } = input;

      if (name.trim().length < 4) {
        throw new GraphQLError("Name can't be shorter than 4 characters long", {
          extensions: {
            code: 'VALIDATION_ERROR',
          },
        });
      }

      user.name = name;

      await user.save();

      return true;
    },
  ),
  logout: authWrapper(
    async (_: any, __: any, context: { exp: any; token: string; res: Response }) => {
      const { exp, token, res } = context;

      res.clearCookie('refresh-token');

      setValue(`bl-${token}`, token, { EX: exp });

      return true;
    },
  ),
  forgetPassword: async (_: any, { input }: { input: { email: string } }, __: any) => {
    const { email } = input;

    const user = await User.findOne({ email });

    if (!user) {
      throw new GraphQLError('There is no such email', {
        extensions: {
          code: 'NOT_FOUND',
        },
      });
    }

    const token = generateToken();

    await Token.create({ userId: user._id, token });

    await sendEmail(email, 'Reset your password', 'reset', {
      link: `/users/reset-password/${token}`,
      title: 'Activate your account',
    });

    return 'Check your email to reset your password';
  },
  resetPassword: async () => {},
};

export default userResolver;
