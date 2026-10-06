import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';
import {
  countVehiclesByStatus,
  countTotalActiveVehicles,
  countTripsByStatus,
  countDriversByStatus,
} from '../repositories/kpi.repository.js';

// ─── Filter Types ─────────────────────────────────────────────────────────────

/**
 * Supported query filters for KPI endpoints.
 * - vehicleType: filters by vehicle type (e.g. "Truck", "Van")
 * - vehicleStatus: filter stub — vehicle counts already query by status directly
 * - region: not in DB schema yet; reserved for future use
 */
export interface KpiFilters {
  vehicleType?: string;
  vehicleStatus?: string;
  region?: string;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface FleetKpiResult {
  vehicles: {
    active: number; // Not retired
    available: number; // VehicleStatus.Available
    onTrip: number; // VehicleStatus.On_Trip
    inMaintenance: number; // VehicleStatus.In_Shop
    retired: number;
  };
  trips: {
    active: number; // trip_status = "Active"
    pending: number; // trip_status = "Pending"
  };
  drivers: {
    onDuty: number; // driver.status = "On Duty"
  };
  fleetUtilizationPct: number; // onTrip / active * 100
}

// ─── KPI Service ──────────────────────────────────────────────────────────────

export async function getFleetKpis(filters: KpiFilters): Promise<FleetKpiResult> {
  // Run all counts in parallel for performance
  const [
    activeVehicles,
    availableVehicles,
    onTripVehicles,
    inMaintenanceVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
  ] = await Promise.all([
    countTotalActiveVehicles(filters),
    countVehiclesByStatus(VehicleStatus.Available, filters),
    countVehiclesByStatus(VehicleStatus.On_Trip, filters),
    countVehiclesByStatus(VehicleStatus.In_Shop, filters),
    countVehiclesByStatus(VehicleStatus.Retired, filters),
    countTripsByStatus(TripStatus.Dispatched, filters), // Active = in progress
    countTripsByStatus(TripStatus.Draft, filters), // Pending = not yet dispatched
    countDriversByStatus(DriverStatus.On_Trip), // On Duty = driver currently on a trip
  ]);

  const fleetUtilizationPct =
    activeVehicles > 0 ? parseFloat(((onTripVehicles / activeVehicles) * 100).toFixed(2)) : 0;

  return {
    vehicles: {
      active: activeVehicles,
      available: availableVehicles,
      onTrip: onTripVehicles,
      inMaintenance: inMaintenanceVehicles,
      retired: retiredVehicles,
    },
    trips: {
      active: activeTrips,
      pending: pendingTrips,
    },
    drivers: {
      onDuty: driversOnDuty,
    },
    fleetUtilizationPct,
  };
}
