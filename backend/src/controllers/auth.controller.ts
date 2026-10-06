import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export const authController = {
  registerCompany: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.registerCompany(
        req.body as {
          companyName: string;
          name: string;
          email: string;
          password: string;
        }
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body as { email: string; password: string });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      const result = await authService.forgotPassword(email);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body as { token: string; newPassword: string };
      const result = await authService.resetPassword(token, newPassword);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
