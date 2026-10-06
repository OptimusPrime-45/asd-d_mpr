import { AnalyticsRepository } from '../repositories/analytics.repository.js';
import { VehicleStatus } from '@prisma/client';

const analyticsRepository = new AnalyticsRepository();
const REVENUE_RATE_PER_DIST = 15.0; // Standard assumed revenue per unit distance of travel (e.g. $15/km or $15/mile)

export class AnalyticsService {
  async getCompanyAnalytics(companyId: number) {
    // 1. Fetch vehicles to calculate fleet utilization and acquisition costs
    const vehicles = await analyticsRepository.getVehiclesByCompany(companyId);

    const activeVehicles = vehicles.filter((v) => v.status !== VehicleStatus.Retired);
    const onTripVehicles = vehicles.filter((v) => v.status === VehicleStatus.On_Trip);

    const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.cost || 0), 0);

    const fleetUtilization =
      activeVehicles.length > 0
        ? parseFloat(((onTripVehicles.length / activeVehicles.length) * 100).toFixed(2))
        : 0;

    // 2. Fetch trips summary
    const tripsSummary = await analyticsRepository.getTripsSummaryByCompany(companyId);

    // 3. Fetch fuel log summary
    const fuelSummary = await analyticsRepository.getFuelLogsSummaryByCompany(companyId);

    // 4. Fetch maintenance summary
    const maintenanceSummary = await analyticsRepository.getMaintenanceSummaryByCompany(companyId);

    // 4b. Fetch 3 costliest vehicles
    const costliestVehicles = await analyticsRepository.getCostliestVehiclesByCompany(companyId);

    // 4c. Fetch completed trips for monthly revenue
    const completedTrips = await analyticsRepository.getCompletedTripsForCompany(companyId);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthlyRevenue = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();

      const tripsInMonth = completedTrips.filter((t) => {
        const tDate = new Date(t.created_at);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
      });

      const revenue = tripsInMonth.reduce((sum, t) => sum + t.trip_dist * REVENUE_RATE_PER_DIST, 0);

      monthlyRevenue.push({
        month: monthName,
        revenue: parseFloat(revenue.toFixed(2)),
      });
    }

    // 5. Perform final analytics calculations
    const fuelEfficiency =
      fuelSummary.totalLitres > 0
        ? parseFloat((tripsSummary.totalDistance / fuelSummary.totalLitres).toFixed(2))
        : 0;

    const operationalCost = fuelSummary.totalFuelCost + maintenanceSummary.totalMaintenanceCost;

    // ROI = (revenue - (maintenance + fuel)) / acquisition_cost
    const totalRevenue = tripsSummary.totalDistance * REVENUE_RATE_PER_DIST;
    const totalCosts = maintenanceSummary.totalMaintenanceCost + fuelSummary.totalFuelCost;

    const vehicleRoi =
      totalAcquisitionCost > 0
        ? parseFloat((((totalRevenue - totalCosts) / totalAcquisitionCost) * 100).toFixed(2))
        : 0;

    return {
      companyId,
      fuelEfficiency,
      fleetUtilization,
      operationalCost,
      vehicleRoi,
      costliestVehicles,
      monthlyRevenue,
      metadata: {
        totalDistance: tripsSummary.totalDistance,
        totalLitres: fuelSummary.totalLitres,
        totalFuelCost: fuelSummary.totalFuelCost,
        totalMaintenanceCost: maintenanceSummary.totalMaintenanceCost,
        totalAcquisitionCost,
        calculatedRevenue: totalRevenue,
      },
    };
  }
}
