'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DriverTable, Driver } from '@/components/drivers/DriverTable';
import { AddDriverForm } from '@/components/drivers/AddDriverForm';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function DriversPage() {
  const { token, logout } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchDrivers = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/drivers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          logout();
          return;
        }

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch drivers');
        }

        setDrivers(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrivers();
  }, [token, logout]);

  // Derived state for filtering
  const filteredDrivers = drivers.filter((d) => {
    const matchStatus = statusFilter === null || d.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      d.license_no.toLowerCase().includes(searchLower) ||
      (d.user?.name || '').toLowerCase().includes(searchLower);

    return matchStatus && matchSearch;
  });

  const statuses = [
    { label: 'Available', value: 'Available', bg: 'bg-green-500', text: 'text-white' },
    { label: 'On Trip', value: 'On Trip', bg: 'bg-blue-500', text: 'text-white' },
    { label: 'Off Duty', value: 'Off Duty', bg: 'bg-gray-500', text: 'text-white' },
    { label: 'Suspended', value: 'Suspended', bg: 'bg-orange-500', text: 'text-white' },
  ];

  return (
    <RouteGuard resource="DRIVERS" required="READ">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-text">
            Drivers & Safety Profiles
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm w-full">
            <input
              type="text"
              placeholder="Search driver name or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block h-9 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text placeholder:text-secondary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Error state */}
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <DriverTable drivers={filteredDrivers} />
        )}

        {/* Toggle Status Buttons Below Table */}
        <div className="flex items-center space-x-4 mt-6 border-t border-border pt-6">
          <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider">
            Toggle Stat
          </span>
          <div className="flex space-x-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(statusFilter === status.value ? null : status.value)}
                className={clsx(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  statusFilter === status.value
                    ? `${status.bg} ${status.text} ring-2 ring-offset-2 ring-${status.bg.split('-')[1]}-500`
                    : `${status.bg} ${status.text} opacity-80 hover:opacity-100`
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Driver">
          <AddDriverForm
            onCancel={() => setIsModalOpen(false)}
            onSuccess={(newDriver) => {
              setDrivers((prev) => [...prev, newDriver]);
              setIsModalOpen(false);
            }}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
