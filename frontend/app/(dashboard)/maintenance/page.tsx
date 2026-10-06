'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import { Wrench, ArrowRight, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface Vehicle {
  reg_no: string;
  vehicle_model: string;
  type: string;
  status: string;
}

export default function MaintenancePage() {
  const { token, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: null as number | null,
    reg_no: '',
    service_type: 'Routine_Service',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Available',
  });
  const [activeMaintenance, setActiveMaintenance] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const fetchVehicles = async () => {
      try {
        const API_URL = getApiUrl();
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

        const allVehicles = data.data || [];
        const filteredVehicles = allVehicles.filter(
          (v: Vehicle) => v.status === 'Available' || v.status === 'In_Shop' || v.status === 'In Shop'
        );

        setVehicles(filteredVehicles);
        if (filteredVehicles.length > 0) {
          setFormData((prev) => ({ ...prev, reg_no: filteredVehicles[0].reg_no }));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [token, logout]);

  useEffect(() => {
    if (!formData.reg_no || !token) return;

    const fetchActiveMaintenance = async () => {
      const selectedVehicle = vehicles.find((v) => v.reg_no === formData.reg_no);
      if (selectedVehicle?.status === 'In_Shop' || selectedVehicle?.status === 'In Shop') {
        try {
          const API_URL = getApiUrl();
          const res = await fetch(`${API_URL}/api/v1/maintenances/active/${formData.reg_no}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data.success && data.data) {
            setActiveMaintenance(data.data);
            setFormData((prev) => ({
              ...prev,
              id: data.data.id,
              service_type: data.data.service_type,
              cost: data.data.cost.toString(),
              date: new Date(data.data.date).toISOString().split('T')[0],
              status: data.data.status,
            }));
          }
        } catch (err) {
          console.error('Failed to fetch active maintenance', err);
        }
      } else {
        setActiveMaintenance(null);
        setFormData((prev) => ({
          ...prev,
          id: null,
          service_type: 'Routine_Service',
          cost: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Available',
        }));
      }
    };

    fetchActiveMaintenance();
  }, [formData.reg_no, vehicles, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const API_URL = getApiUrl();
      const isCurrentlyInShop = !!activeMaintenance;

      if (isCurrentlyInShop) {
        // Update existing maintenance record to Completed/Available
        if (formData.status === 'Available') {
          const res = await fetch(`${API_URL}/api/v1/maintenances/${formData.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: formData.status }),
          });
          if (!res.ok) throw new Error('Failed to update maintenance record');

          // Update vehicle status to Available
          const vehicleRes = await fetch(`${API_URL}/api/v1/vehicles/${formData.reg_no}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'Available' }),
          });
          if (!vehicleRes.ok) throw new Error('Failed to update vehicle status');

          setSuccessMsg(`Vehicle ${formData.reg_no} is now Available.`);
          setVehicles((prev) =>
            prev.map((v) => (v.reg_no === formData.reg_no ? { ...v, status: 'Available' } : v))
          );
          setActiveMaintenance(null);
        } else {
          throw new Error('Vehicle is already In Shop.');
        }
      } else {
        // Creating a new maintenance record and putting vehicle In Shop
        if (formData.status === 'In Shop') {
          const maintenancePayload = {
            reg_no: formData.reg_no,
            service_type: formData.service_type,
            cost: parseFloat(formData.cost),
            date: new Date(formData.date).toISOString(),
            status: formData.status,
          };

          const res = await fetch(`${API_URL}/api/v1/maintenances`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(maintenancePayload),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to log maintenance record');
          }

          // Automatically update vehicle status to "In Shop"
          const vehicleRes = await fetch(`${API_URL}/api/v1/vehicles/${formData.reg_no}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'In_Shop' }),
          });
          if (!vehicleRes.ok) throw new Error('Failed to update vehicle status');

          setSuccessMsg(`Service record created. Vehicle ${formData.reg_no} is now In Shop.`);
          setVehicles((prev) =>
            prev.map((v) => (v.reg_no === formData.reg_no ? { ...v, status: 'In_Shop' } : v))
          );
        } else {
          throw new Error('Please select "In Shop" to log a new maintenance record.');
        }
      }

      // Reset form if vehicle is not in shop
      if (!isCurrentlyInShop || formData.status === 'Available') {
        setFormData((prev) => ({
          ...prev,
          cost: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Available',
        }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-primary-text">
          Vehicle Maintenance
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Log Service Form */}
        <div className="lg:col-span-7 bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Wrench className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary-text">Log Service Record</h2>
            </div>
            {activeMaintenance?.jira_issue_key && (
              <a
                href={activeMaintenance.jira_issue_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                title="View work order in Atlassian Jira"
              >
                <span>Jira: {activeMaintenance.jira_issue_key}</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                  {activeMaintenance.jira_status || 'Open'}
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeMaintenance && (
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start justify-between">
                <div>
                  <span className="font-semibold block text-sm mb-0.5 text-blue-950">Active Maintenance Order</span>
                  <p className="text-blue-800">
                    Vehicle is currently In Shop for <strong>{activeMaintenance.service_type?.replace(/_/g, ' ')}</strong>.
                  </p>
                </div>
                {activeMaintenance.jira_issue_key && (
                  <a
                    href={activeMaintenance.jira_issue_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 font-semibold text-blue-700 hover:underline shrink-0 ml-2"
                  >
                    <span>View Ticket</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="reg_no" className="text-sm font-medium text-primary-text">
                Vehicle
              </label>
              {isLoadingVehicles ? (
                <div className="h-10 w-full rounded-md border border-border bg-black/5 animate-pulse" />
              ) : (
                <select
                  id="reg_no"
                  name="reg_no"
                  required
                  value={formData.reg_no}
                  onChange={handleChange}
                  className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {vehicles.length === 0 ? (
                    <option value="">No vehicles found</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.reg_no} value={v.reg_no}>
                        {v.reg_no} - {v.vehicle_model} ({v.status})
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="service_type" className="text-sm font-medium text-primary-text">
                Service Type
              </label>
              <select
                id="service_type"
                name="service_type"
                required
                disabled={!!activeMaintenance}
                value={formData.service_type}
                onChange={handleChange}
                className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Routine_Service">Routine Service</option>
                <option value="Oil_Change">Oil Change</option>
                <option value="Tire_Replacement">Tire Replacement</option>
                <option value="Brake_Service">Brake Service</option>
                <option value="Engine_Repair">Engine Repair</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="cost" className="text-sm font-medium text-primary-text">
                Cost
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                required
                min="0.01"
                step="0.01"
                disabled={!!activeMaintenance}
                placeholder="e.g. 2500"
                value={formData.cost}
                onChange={handleChange}
                className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="date" className="text-sm font-medium text-primary-text">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                disabled={!!activeMaintenance}
                value={formData.date}
                onChange={handleChange}
                className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="status" className="text-sm font-medium text-primary-text">
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Available">Available</option>
                <option value="In Shop">In Shop</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || vehicles.length === 0}
                className="w-full inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>

        {/* Documentation / Info Block */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex-1">
            <h3 className="text-md font-semibold text-primary-text mb-4">Maintenance Process</h3>

            <div className="space-y-6 text-sm text-secondary-text">
              {/* Lifecycle Flow 1 */}
              <div className="flex flex-col space-y-2 p-3 bg-black/5 rounded-lg border border-border/50">
                <span className="font-semibold text-primary-text">Vehicle Check-In</span>
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800">Available</span>
                  <ArrowRight className="h-4 w-4 text-secondary-text" />
                  <span className="text-secondary-text font-normal">creating active record</span>
                  <ArrowRight className="h-4 w-4 text-secondary-text" />
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">In Shop</span>
                </div>
              </div>

              {/* Lifecycle Flow 2 */}
              <div className="flex flex-col space-y-2 p-3 bg-black/5 rounded-lg border border-border/50">
                <span className="font-semibold text-primary-text">Vehicle Release</span>
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">In Shop</span>
                  <ArrowRight className="h-4 w-4 text-secondary-text" />
                  <span className="text-secondary-text font-normal">
                    closing record (not retired)
                  </span>
                  <ArrowRight className="h-4 w-4 text-secondary-text" />
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800">Available</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 text-xs space-y-2">
                <p className="font-medium text-primary-text">Dispatch Exclusions:</p>
                <p>
                  Vehicles flagged as <span className="font-semibold text-amber-800">In Shop</span>{' '}
                  are automatically filtered out from driver pools, active trip requests, and
                  vehicle assignment options across the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
