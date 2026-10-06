'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Fuel, Percent, TrendingUp, DollarSign } from 'lucide-react';

interface CostliestVehicle {
  reg_no: string;
  vehicle_model: string;
  type: string;
  cost: number;
}

interface MonthlyRevenueData {
  month: string;
  revenue: number;
}

interface AnalyticsData {
  fuelEfficiency: number;
  fleetUtilization: number;
  operationalCost: number;
  vehicleRoi: number;
  costliestVehicles: CostliestVehicle[];
  monthlyRevenue: MonthlyRevenueData[];
}

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    const fetchAnalytics = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const companyId = (user as any).companyId || 1;

        const res = await fetch(`${API_URL}/api/v1/analytics/${companyId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to fetch analytics');
        }

        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, token]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error || 'Failed to load analytics data'}
      </div>
    );
  }

  // Find max cost to scale top costliest vehicles progress bars
  const maxVehicleCost = data.costliestVehicles.reduce(
    (max, v) => (v.cost > max ? v.cost : max),
    1
  );

  // Find max monthly revenue to scale the custom monthly revenue bar chart
  const maxRevenue = data.monthlyRevenue.reduce((max, m) => (m.revenue > max ? m.revenue : max), 1);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-text">Fleet Analytics</h1>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fuel Efficiency */}
        <div className="bg-surface border border-border p-5 rounded-lg border-l-4 border-l-sky-500 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
              Fuel Efficiency
            </span>
            <Fuel className="h-4 w-4 text-sky-500" />
          </div>
          <span className="text-2xl font-bold text-primary-text leading-tight mt-2">
            {data.fuelEfficiency}{' '}
            <span className="text-xs font-normal text-secondary-text">km/l</span>
          </span>
        </div>

        {/* Fleet Utilization */}
        <div className="bg-surface border border-border p-5 rounded-lg border-l-4 border-l-emerald-600 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
              Fleet Utilization
            </span>
            <Percent className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-primary-text leading-tight mt-2">
            {data.fleetUtilization}%
          </span>
        </div>

        {/* Operational Cost */}
        <div className="bg-surface border border-border p-5 rounded-lg border-l-4 border-l-amber-600 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
              Operational Cost
            </span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-primary-text leading-tight mt-2">
            ${data.operationalCost.toLocaleString()}
          </span>
        </div>

        {/* Vehicle ROI */}
        <div className="bg-surface border border-border p-5 rounded-lg border-l-4 border-l-indigo-600 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-secondary-text uppercase tracking-wider">
              Vehicle ROI
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-bold text-primary-text leading-tight mt-2">
            {data.vehicleRoi}%
          </span>
        </div>
      </div>

      {/* Formula helper label */}
      <div className="text-[12px] text-secondary-text italic px-1">
        ROI Formula: (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </div>

      {/* Main Grid: Revenue Chart and Costliest Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-8 bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <h3 className="text-md font-semibold text-primary-text mb-6">Monthly Revenue</h3>

          <div className="relative h-64 flex items-end justify-between px-2 pt-6 border-b border-border pb-2">
            {data.monthlyRevenue.map((m, index) => {
              const heightPercent = maxRevenue > 0 ? (m.revenue / maxRevenue) * 80 + 10 : 10;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center justify-end h-full flex-1 group"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-primary-text text-white text-xs rounded py-1 px-2 mb-2 bottom-[calc(100%-8px)] pointer-events-none whitespace-nowrap shadow-md">
                    ${m.revenue.toLocaleString()}
                  </div>

                  {/* Dynamic height bar */}
                  <div
                    className="w-8 sm:w-12 bg-primary/70 hover:bg-primary rounded-t transition-all duration-500 ease-out cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Label */}
                  <span className="text-[11px] font-medium text-secondary-text mt-2">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <h3 className="text-md font-semibold text-primary-text mb-6">Top Costliest Vehicles</h3>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {data.costliestVehicles.map((v, index) => {
              const fillPercent = maxVehicleCost > 0 ? (v.cost / maxVehicleCost) * 100 : 0;
              // Cycle bar colors for premium aesthetic
              const barColors = ['bg-rose-500/80', 'bg-amber-600/80', 'bg-sky-500/80'];
              return (
                <div key={v.reg_no} className="space-y-2">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-primary-text font-semibold">{v.reg_no}</span>
                    <span className="text-secondary-text">${v.cost.toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-black/5 rounded-full overflow-hidden border border-border/80">
                    <div
                      className={`h-full ${barColors[index % barColors.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
