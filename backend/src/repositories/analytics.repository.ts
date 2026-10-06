import { prisma } from '../config/prisma.js';
import { VehicleStatus } from '@prisma/client';

export class AnalyticsRepository {
  /**
   * Get all vehicles for a company
   */
  async getVehiclesByCompany(companyId: number) {
    return prisma.vehicles.findMany({
      where: { company_id: companyId },
    });
  }

  /**
   * Get 3 costliest vehicles for a company
   */
  async getCostliestVehiclesByCompany(companyId: number) {
    return prisma.vehicles.findMany({
      where: { company_id: companyId },
      orderBy: {
        cost: 'desc',
      },
      take: 3,
    });
  }

  /**
   * Get completed trips for a company
   */
  async getCompletedTripsForCompany(companyId: number) {
    return prisma.trip.findMany({
      where: {
        vehicle: {
          company_id: companyId,
        },
        trip_status: 'Completed',
      },
      select: {
        created_at: true,
        trip_dist: true,
      },
    });
  }

  /**
   * Get sum of trip distance and count of trips
   */
  async getTripsSummaryByCompany(companyId: number) {
    const result = await prisma.trip.aggregate({
      where: {
        vehicle: {
          company_id: companyId,
        },
      },
      _sum: {
        trip_dist: true,
      },
    });
    return {
      totalDistance: result._sum.trip_dist || 0,
    };
  }

  /**
   * Get sum of fuel cost and litres
   */
  async getFuelLogsSummaryByCompany(companyId: number) {
    const result = await prisma.fuel_Logs.aggregate({
      where: {
        vehicle: {
          company_id: companyId,
        },
      },
      _sum: {
        fuel_cost: true,
        litres: true,
      },
    });
    return {
      totalFuelCost: result._sum.fuel_cost || 0,
      totalLitres: result._sum.litres || 0,
    };
  }

  /**
   * Get sum of maintenance costs
   */
  async getMaintenanceSummaryByCompany(companyId: number) {
    const result = await prisma.maintenance.aggregate({
      where: {
        vehicle: {
          company_id: companyId,
        },
      },
      _sum: {
        cost: true,
      },
    });
    return {
      totalMaintenanceCost: result._sum.cost || 0,
    };
  }
}
