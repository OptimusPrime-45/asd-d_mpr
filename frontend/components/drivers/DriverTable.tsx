"use client";

import React from "react";
import clsx from "clsx";

export interface Driver {
  license_no: string;
  driver_id: number;
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
  safety_score: number;
  license_type: string;
  expiry_date: string;
  contact_number: string;
  trip_completion_rate: number;
  user?: {
    name: string;
    email: string;
  };
}

interface DriverTableProps {
  drivers: Driver[];
}

export function DriverTable({ drivers }: DriverTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-700 border-green-200";
      case "On Trip":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Off Duty":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Suspended":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="mt-6 flex flex-col">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden border border-border sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-black/5">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-text sm:pl-6">
                    Driver
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    License No
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Expiry
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Trip Compl.
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Safety
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {drivers.map((driver) => (
                  <tr key={driver.license_no} className="hover:bg-black/2 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-primary-text sm:pl-6">
                      {driver.user?.name || "Unknown"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {driver.license_no}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {driver.license_type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {formatDate(driver.expiry_date)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {driver.contact_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text">
                      {driver.trip_completion_rate}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-secondary-text font-medium">
                      {driver.safety_score}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
                          getStatusBadge(driver.status)
                        )}
                      >
                        {driver.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-secondary-text">
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
