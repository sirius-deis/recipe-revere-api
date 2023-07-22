import dotenv from 'dotenv';
dotenv.config();
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
  const exp = (payload as JwtExpPayload).exp;
  return { user, exp };
};

export default verifyToken;
