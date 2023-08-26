import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError.js';

const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
  } else {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export default errorHandler;
