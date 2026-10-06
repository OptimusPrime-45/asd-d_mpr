import { ExpenseRepository } from '../repositories/expense.repository.js';
import { TripRepository } from '../repositories/trip.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/index.js';
import type { Expenses } from '@prisma/client';

const expenseRepository = new ExpenseRepository();
const tripRepository = new TripRepository();

export class ExpenseService {
  async recordExpense(
    companyId: number,
    data: {
      trip_id: number;
      reg_no: string;
      maintenance: number;
      toll: number;
      others: number;
    }
  ): Promise<Expenses> {
    // 1. Verify trip exists and belongs to requesting company
    const trip = await tripRepository.findByIdWithOwner(data.trip_id);
    if (!trip) {
      throw new NotFoundError(`Trip with ID ${data.trip_id} not found`);
    }

    if (trip.vehicle.company_id !== companyId) {
      throw new ForbiddenError('You do not have permission to access this trip');
    }

    // 2. Verify registration number belongs to the same trip
    if (trip.reg_no !== data.reg_no) {
      throw new BadRequestError(`Vehicle ${data.reg_no} is not assigned to Trip ${data.trip_id}`);
    }

    return expenseRepository.create({
      trip_id: data.trip_id,
      reg_no: data.reg_no,
      maintenance: data.maintenance,
      toll: data.toll,
      others: data.others,
    });
  }

  async getExpenses(companyId: number) {
    return expenseRepository.findByCompany(companyId);
  }
}
