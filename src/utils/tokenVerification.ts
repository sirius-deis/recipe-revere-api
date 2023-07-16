import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { Request, Response, NextFunction } from 'express';
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
    throw new GraphQLError('Token verification failed', {
      extensions: {
        code: 'TOKEN_VERIFICATION_FAILED',
      },
    });
  }
  const token = match[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET!);
  } catch (error) {
    throw new GraphQLError('Token verification failed', {
      extensions: {
        code: 'TOKEN_VERIFICATION_FAILED',
      },
    });
  }

  const user = await User.findById((payload as UserPayload).userId);
  return { user };
};

export default verifyToken;
