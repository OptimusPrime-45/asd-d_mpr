'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { VehicleTable, Vehicle } from '@/components/vehicles/VehicleTable';
import { AddVehicleForm } from '@/components/vehicles/AddVehicleForm';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function FleetPage() {
  const { token, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchVehicles = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/vehicles`, {
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
          throw new Error(data.message || 'Failed to fetch vehicles');
        }

        setVehicles(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [token, logout]);

  // Derived state for filtering
  const filteredVehicles = vehicles.filter((v) => {
    const matchType = typeFilter === 'All' || v.type === typeFilter;
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchSearch =
      v.reg_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase());

    return matchType && matchStatus && matchSearch;
  });

  const uniqueTypes = ['All', ...Array.from(new Set(vehicles.map((v) => v.type)))];
  const uniqueStatuses = ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];

  return (
    <RouteGuard resource="FLEET" required="READ">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-text">
            Vehicle Registry
          </h1>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <label htmlFor="type" className="text-sm font-medium text-secondary-text">
                Type:
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-black/5 px-3 py-1.5 text-sm text-primary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="status" className="text-sm font-medium text-secondary-text">
                Status:
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-border bg-black/5 px-3 py-1.5 text-sm text-primary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {uniqueStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search reg. no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block h-9 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text placeholder:text-secondary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </button>
        </div>

        {/* Error state */}
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <VehicleTable vehicles={filteredVehicles} />
        )}

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Vehicle">
          <AddVehicleForm
            onCancel={() => setIsModalOpen(false)}
            onSuccess={(newVehicle) => {
              setVehicles((prev) => [...prev, newVehicle]);
              setIsModalOpen(false);
            }}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
