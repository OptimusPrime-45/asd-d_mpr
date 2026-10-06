import type { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service.js';

const expenseService = new ExpenseService();

export class ExpenseController {
  async recordExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const expense = await expenseService.recordExpense(companyId, req.body);
      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user!.companyId;
      const expenses = await expenseService.getExpenses(companyId);
      res.status(200).json({
        success: true,
        message: 'Expenses fetched successfully',
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  }
}
