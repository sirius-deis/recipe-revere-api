import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.js';
import Token from '../models/token.js';
import AppError from '../utils/appError.js';
import User from '../models/user.js';

export const activateAccount = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void | NextFunction> => {
    const { token } = req.params;

    const foundToken = await Token.findOne({ token });

    if (!foundToken) {
      return next(new AppError('There is no such token', 404));
    }

    const user = await User.findById(foundToken.userId);

    if (!user) {
      return next(new AppError('There is no such user for provided token. Please try again', 404));
    }

    user.isActive = true;

    await user.save();

    res.status(200).json({ message: 'Your account was activated successfully' });
  },
);
