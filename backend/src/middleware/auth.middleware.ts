import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../errors/index.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing'));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Authentication token missing'));
  }

  try {
    // verifyToken throws UnauthorizedError if the token is invalid/expired
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
};
