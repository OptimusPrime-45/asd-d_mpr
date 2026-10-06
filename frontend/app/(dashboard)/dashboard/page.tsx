'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { Search, ChevronDown, Loader2, RefreshCw } from 'lucide-react';

interface KPIResponse {
  vehicles: {
    active: number;
    available: number;
    onTrip: number;
    inMaintenance: number;
    retired: number;
  };
  trips: {
    active: number;
    pending: number;
  };
  drivers: {
    onDuty: number;
  };
  fleetUtilizationPct: number;
}

interface RecentTrip {
  tripId: number;
  regNo: string;
  src: string;
  dest: string;
  srcLat?: number;
  srcLng?: number;
  destLat?: number;
  destLng?: number;
  vehicleModel: string;
  driverName: string;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  createdAt: string;
  hasStarted: boolean;
}

export default function DashboardPage() {
  const { user, token } = useAuth();

  // Filters
  const [vehicleType, setVehicleType] = useState<string>('All');
  const [tripStatus, setTripStatus] = useState<string>('All');
  const [region, setRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [kpiData, setKpiData] = useState<KPIResponse | null>(null);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch KPI & Trip Data
  const fetchData = async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    const API_URL = getApiUrl();
    // cast to any to get companyId since auth context user type is extended at runtime
    const companyId = (user as any).companyId || 1;

    try {
      // 1. Build Query Params
      const kpiParams = new URLSearchParams();
      if (vehicleType !== 'All') {
        kpiParams.append('vehicleType', vehicleType);
      }

      const tripParams = new URLSearchParams();
      if (vehicleType !== 'All') {
        tripParams.append('vehicleType', vehicleType);
      }
      if (tripStatus !== 'All') {
        tripParams.append('status', tripStatus);
      }

      // 2. Fetch in parallel
      const [kpiRes, tripsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/kpi?${kpiParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/v1/trips/recent/${companyId}?${tripParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (!kpiRes.ok) {
        throw new Error('Failed to load dashboard data. Please try again.');
      }

      const kpiJson = await kpiRes.json();
      setKpiData(kpiJson.data);

      if (tripsRes && tripsRes.ok) {
        const tripsJson = await tripsRes.json();
        setRecentTrips(tripsJson.data || []);
      } else {
        setRecentTrips([]);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token, vehicleType, tripStatus]);

  // Helper: Map status colors for badges
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-50 text-green-700 border border-green-200/50';
      case 'Dispatched':
        return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border border-red-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  // Helper: Map status name for display
  const getStatusLabel = (status: string) => {
    if (status === 'Dispatched') return 'On Trip';
    return status;
  };

  // Helper: ETA mock resolver
  const getEta = (tripId: number, status: string) => {
    if (status === 'Completed' || status === 'Cancelled') return '—';
    if (status === 'Draft') return 'Awaiting vehicle';
    // Dispatched / On Trip mocks
    if (tripId % 2 === 0) return '1h 10m';
    return '45 min';
  };

  // Helper: Map coordinates or location name to Indian regions
  const getRegionFromLocation = (trip: RecentTrip) => {
    const { srcLat, srcLng } = trip;
    if (srcLat === undefined || srcLat === null || srcLng === undefined || srcLng === null) {
      const val = (trip.src || '').toLowerCase();
      if (
        val.includes('ny') ||
        val.includes('new york') ||
        val.includes('ma') ||
        val.includes('boston')
      )
        return 'East';
      if (val.includes('tx') || val.includes('houston') || val.includes('dallas')) return 'South';
      if (val.includes('ca') || val.includes('los angeles') || val.includes('san francisco'))
        return 'West';
      if (
        val.includes('il') ||
        val.includes('chicago') ||
        val.includes('mi') ||
        val.includes('detroit')
      )
        return 'North';
      return 'North';
    }

    if (srcLat < 16.5) return 'South';
    if (srcLng > 84.0) return 'East';
    if (srcLng < 75.5) return 'West';
    if (srcLat > 23.5) return 'North';
    return 'Central';
  };

  // Filter recent trips client-side by search query and region
  const filteredTrips = recentTrips.filter((trip) => {
    if (region !== 'All') {
      const tripRegion = getRegionFromLocation(trip);
      if (tripRegion !== region) return false;
    }

    const searchLower = searchQuery.toLowerCase();
    return (
      `tr${String(trip.tripId).padStart(3, '0')}`.includes(searchLower) ||
      trip.regNo?.toLowerCase().includes(searchLower) ||
      trip.driverName?.toLowerCase().includes(searchLower) ||
      trip.status?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate percentages for vehicle status bars
  const totalVehicles = kpiData
    ? kpiData.vehicles.available +
      kpiData.vehicles.onTrip +
      kpiData.vehicles.inMaintenance +
      kpiData.vehicles.retired
    : 0;

  const getPercent = (count: number) => {
    if (totalVehicles === 0) return 0;
    return Math.round((count / totalVehicles) * 100);
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER CONTROLS */}
      <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-[14px] font-semibold text-secondary-text uppercase tracking-wider">
            Filters
          </span>
          <button
            onClick={fetchData}
            title="Refresh Dashboard"
            className="p-1.5 hover:bg-background rounded-md transition-colors text-secondary-text"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:w-auto w-full">
          {/* Vehicle Type Filter */}
          <div className="relative">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full md:w-44 h-10 rounded-md bg-background border border-border px-3 pr-8 text-[13px] font-medium text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none animate-none"
            >
              <option value="All">Vehicle Type: All</option>
              <option value="Van">Van</option>
              <option value="Heavy Truck">Heavy Truck</option>
              <option value="Light Truck">Light Truck</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text pointer-events-none" />
          </div>

          {/* Trip Status Filter */}
          <div className="relative">
            <select
              value={tripStatus}
              onChange={(e) => setTripStatus(e.target.value)}
              className="w-full md:w-44 h-10 rounded-md bg-background border border-border px-3 pr-8 text-[13px] font-medium text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none animate-none"
            >
              <option value="All">Status: All</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">On Trip</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text pointer-events-none" />
          </div>

          {/* Region Filter */}
          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full md:w-44 h-10 rounded-md bg-background border border-border px-3 pr-8 text-[13px] font-medium text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none animate-none"
            >
              <option value="All">Region: All</option>
              <option value="North">North Region</option>
              <option value="South">South Region</option>
              <option value="East">East Region</option>
              <option value="West">West Region</option>
              <option value="Central">Central Region</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 2. STATS CARDS GRID */}
      {loading && !kpiData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border p-4 rounded-lg h-24 animate-pulse"
            />
          ))}
        </div>
      ) : (
        kpiData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* Active Vehicles */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-blue-500 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Active Vehicles
              </span>
              <span className="text-3xl font-bold text-primary-text leading-tight">
                {kpiData.vehicles.active}
              </span>
            </div>

            {/* Available Vehicles */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-green-600 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Available Vehicles
              </span>
              <span className="text-3xl font-bold text-green-600 leading-tight">
                {kpiData.vehicles.available}
              </span>
            </div>

            {/* Vehicles in Maintenance */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-amber-600 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                In Maintenance
              </span>
              <span className="text-3xl font-bold text-amber-600 leading-tight">
                {String(kpiData.vehicles.inMaintenance).padStart(2, '0')}
              </span>
            </div>

            {/* Active Trips */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-sky-500 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Active Trips
              </span>
              <span className="text-3xl font-bold text-primary-text leading-tight">
                {kpiData.trips.active}
              </span>
            </div>

            {/* Pending Trips */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-slate-400 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Pending Trips
              </span>
              <span className="text-3xl font-bold text-primary-text leading-tight">
                {String(kpiData.trips.pending).padStart(2, '0')}
              </span>
            </div>

            {/* Drivers on Duty */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-indigo-500 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Drivers on Duty
              </span>
              <span className="text-3xl font-bold text-primary-text leading-tight">
                {kpiData.drivers.onDuty}
              </span>
            </div>

            {/* Fleet Utilization */}
            <div className="bg-surface border border-border p-4 rounded-lg border-l-4 border-l-green-600 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
                Fleet Utilization
              </span>
              <span className="text-3xl font-bold text-green-600 leading-tight">
                {Math.round(kpiData.fleetUtilizationPct)}%
              </span>
            </div>
          </div>
        )
      )}

      {/* 3. SPLIT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Table Section: Recent Trips */}
        <div className="bg-surface border border-border rounded-lg shadow-xs lg:col-span-2 flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[16px] font-bold text-primary-text">Recent Trips</h3>

            {/* Table Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-secondary-text/70" />
              <input
                type="text"
                placeholder="Search local trips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 bg-background border border-border rounded-md text-[13px] placeholder:text-secondary-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-border bg-background/50 text-[11px] font-bold text-secondary-text uppercase tracking-wider">
                  <th className="px-5 py-3.5">Trip</th>
                  <th className="px-5 py-3.5">Vehicle</th>
                  <th className="px-5 py-3.5">Driver</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading && recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-secondary-text">
                      Loading trips...
                    </td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-secondary-text">
                      No trips found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip.tripId} className="hover:bg-background/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-primary-text">
                        TR{String(trip.tripId).padStart(3, '0')}
                      </td>
                      <td className="px-5 py-3.5 text-secondary-text">{trip.regNo || '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-primary-text">
                        {trip.driverName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-[12px] font-semibold leading-none ${getStatusBadgeStyles(trip.status)}`}
                        >
                          {getStatusLabel(trip.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-text font-medium">
                        {getEta(trip.tripId, trip.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Vehicle Status Progress Bars */}
        <div className="bg-surface border border-border rounded-lg shadow-xs p-5 flex flex-col justify-between">
          <h3 className="text-[16px] font-bold text-primary-text border-b border-border pb-4 mb-4">
            Vehicle Status
          </h3>

          {loading && !kpiData ? (
            <div className="space-y-6 flex-1 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-background w-1/4 rounded"></div>
                  <div className="h-3 bg-background rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            kpiData && (
              <div className="space-y-5 flex-1 flex flex-col justify-center">
                {/* Available */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-secondary-text">Available</span>
                    <span className="text-primary-text">
                      {kpiData.vehicles.available} ({getPercent(kpiData.vehicles.available)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden border border-border/80">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(kpiData.vehicles.available)}%` }}
                    ></div>
                  </div>
                </div>

                {/* On Trip */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-secondary-text">On Trip</span>
                    <span className="text-primary-text">
                      {kpiData.vehicles.onTrip} ({getPercent(kpiData.vehicles.onTrip)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden border border-border/80">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(kpiData.vehicles.onTrip)}%` }}
                    ></div>
                  </div>
                </div>

                {/* In Shop */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-secondary-text">In Shop</span>
                    <span className="text-primary-text">
                      {kpiData.vehicles.inMaintenance} ({getPercent(kpiData.vehicles.inMaintenance)}
                      %)
                    </span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden border border-border/80">
                    <div
                      className="h-full bg-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(kpiData.vehicles.inMaintenance)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Retired */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] font-semibold">
                    <span className="text-secondary-text">Retired</span>
                    <span className="text-primary-text">
                      {kpiData.vehicles.retired} ({getPercent(kpiData.vehicles.retired)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden border border-border/80">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercent(kpiData.vehicles.retired)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          )}

          <div className="text-[11px] text-secondary-text text-center border-t border-border pt-4 mt-4">
            Total Managed Fleet:{' '}
            <span className="font-semibold text-primary-text">{totalVehicles} Vehicles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
