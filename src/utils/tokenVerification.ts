import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { Request, Response } from 'express';
import User from '../models/user.js';

const { JWT_SECRET } = process.env;

interface UserPayload {
  userId: string;
}

interface JwtExpPayload {
  iat: number;
  exp: number;
}

const verifyToken = async ({ req, res }: { req: Request; res: Response }) => {
  const match = req.headers.authorization?.match(/^Bearer (.*)$/);
  if (!match) {
    return {};
  }
  const token = match[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET!);
  } catch (error) {
    return {};
  }

  const user = await User.findById((payload as UserPayload).userId);

  if (!user?.isActive) {
    throw new GraphQLError('Please activate account first', {
      extensions: {
        code: 'AUTHENTICATION_FAILED',
        http: { status: 401 },
      },
    });
  }

  if (!user.isBlocked) {
    throw new GraphQLError('You was blocked', {
      extensions: {
        code: 'AUTHENTICATION_FAILED',
        http: { status: 401 },
      },
    });
  }

  if ((payload as JwtExpPayload).iat * 1000 < user.passwordChangedAt) {
    throw new GraphQLError('Pleas login again', {
      extensions: {
        code: 'TOKEN VERIFICATION FAILED',
        http: { status: 401 },
      },
    });
  }

  const exp = (payload as JwtExpPayload).exp;
  return { user, exp, token, res };
};

export default verifyToken;
