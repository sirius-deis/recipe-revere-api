import { Request, Response, NextFunction } from 'express';

export const activateAccount = (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({ message: 'Your account was activated successfully' });
};
