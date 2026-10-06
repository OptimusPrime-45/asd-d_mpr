'use client';

import React from 'react';
import clsx from 'clsx';

export interface Vehicle {
  reg_no: string;
  vehicle_model: string;
  type: string;
  load_capacity: number;
  odometer_reading: number;
  cost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

interface VehicleTableProps {
  vehicles: Vehicle[];
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const getStatusBadge = (status: Vehicle['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'On Trip':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Shop':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Retired':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="mt-6 flex flex-col">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden border border-border sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-black/5">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-text sm:pl-6"
                  >
                    Reg. No. (Unique)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Name/Model
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Capacity
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Odometer
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Acq. Cost
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.reg_no} className="hover:bg-black/2 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-primary-text sm:pl-6">
                      {vehicle.reg_no}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {vehicle.vehicle_model}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {vehicle.type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {formatNumber(vehicle.load_capacity)} kg
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {formatNumber(vehicle.odometer_reading)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {formatNumber(vehicle.cost)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium',
                          getStatusBadge(vehicle.status)
                        )}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-secondary-text">
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-primary font-medium">
        <p>
          Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip
          Dispatcher
        </p>
      </div>
    </div>
  );
}
