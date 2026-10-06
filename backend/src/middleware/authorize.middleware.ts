import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/index.js';
import { prisma } from '../config/prisma.js';

export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};

export const permissionMiddleware = (resource: string, requiredAccess: 'READ' | 'WRITE') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const userRole = req.user.role;

      // Admin bypasses all permissions checks
      if (userRole === 'ADMIN') {
        return next();
      }

      const permission = await prisma.rolePermissions.findFirst({
        where: {
          role: { role: userRole as any },
          resource,
        },
      });

      if (!permission) {
        return next(new ForbiddenError('Insufficient permissions'));
      }

      if (requiredAccess === 'WRITE' && permission.access !== 'WRITE') {
        return next(new ForbiddenError('Write access required'));
      }

      if (requiredAccess === 'READ' && permission.access === 'NONE') {
        return next(new ForbiddenError('Read access required'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
