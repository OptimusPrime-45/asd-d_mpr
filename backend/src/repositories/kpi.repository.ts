import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import type { KpiFilters } from '../services/kpi.service.js';

// ─── Vehicle Counts ───────────────────────────────────────────────────────────

export async function countVehiclesByStatus(
  status: VehicleStatus,
  filters: KpiFilters
): Promise<number> {
  return prisma.vehicles.count({
    where: {
      status,
      ...(filters.vehicleType && { type: filters.vehicleType }),
    },
  });
}

export async function countTotalActiveVehicles(filters: KpiFilters): Promise<number> {
  return prisma.vehicles.count({
    where: {
      status: { not: VehicleStatus.Retired },
      ...(filters.vehicleType && { type: filters.vehicleType }),
    },
  });
}

// ─── Trip Counts ──────────────────────────────────────────────────────────────

export async function countTripsByStatus(
  tripStatus: TripStatus,
  filters: KpiFilters
): Promise<number> {
  return prisma.trip.count({
    where: {
      trip_status: tripStatus,
      ...(filters.vehicleType && {
        vehicle: { type: filters.vehicleType },
      }),
    },
  });
}

// ─── Driver Counts ────────────────────────────────────────────────────────────

export async function countDriversByStatus(driverStatus: DriverStatus): Promise<number> {
  return prisma.driver.count({
    where: {
      status: driverStatus,
    },
  });
}
