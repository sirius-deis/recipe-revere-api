import { Request, Response, NextFunction } from 'express';

const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void | NextFunction>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void | NextFunction> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      return next(error);
    }
  };

export default catchAsync;
