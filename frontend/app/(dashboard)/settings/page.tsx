'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

interface PermissionFromAPI {
  id: number;
  role_id: number;
  resource: string;
  access: string;
  role: {
    id: number;
    role: string;
  };
}

const RESOURCES = ['FLEET', 'DRIVERS', 'TRIPS', 'FUEL_EXPENSE', 'ANALYTICS'];
const ACCESS_LEVELS = ['WRITE', 'READ', 'NONE'];

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  DRIVER: 'Driver',
};

const RESOURCE_DISPLAY_NAMES: Record<string, string> = {
  FLEET: 'FLEET',
  DRIVERS: 'DRIVERS',
  TRIPS: 'TRIPS',
  FUEL_EXPENSE: 'FUEL/EXP.',
  ANALYTICS: 'ANALYTICS',
};

export default function SettingsPage() {
  const { user, token, isLoading } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // General Settings States
  const [depotName, setDepotName] = useState('');
  const [currency, setCurrency] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('');

  // RBAC States
  const [permissions, setPermissions] = useState<PermissionFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [generalSaveLoading, setGeneralSaveLoading] = useState(false);
  const [rbacSaveLoading, setRbacSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch settings & permissions
  const fetchAllSettings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Company Settings
      const companyRes = await fetch(`${API_URL}/api/v1/company/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (companyRes.ok) {
        const companyJson = await companyRes.json();
        if (companyJson.data) {
          setDepotName(companyJson.data.name || '');
          setCurrency(companyJson.data.currency || '');
          setDistanceUnit(companyJson.data.distance_unit || '');
        }
      }

      // 2. Fetch Permissions Matrix
      const res = await fetch(`${API_URL}/api/v1/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const json = await res.json();
      setPermissions(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllSettings();
    }
  }, [token]);

  // Handle cell value change
  const handleAccessChange = (roleName: string, resource: string, newAccess: string) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.role.role === roleName && p.resource === resource) {
          return { ...p, access: newAccess };
        }
        return p;
      })
    );
  };

  // Submit General changes
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralSaveLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const companyRes = await fetch(`${API_URL}/api/v1/company/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: depotName,
          currency,
          distance_unit: distanceUnit,
        }),
      });

      if (!companyRes.ok) {
        const companyJson = await companyRes.json();
        throw new Error(companyJson.message || 'Failed to update company settings');
      }

      setSuccessMsg('General settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAllSettings(); // Refresh state
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving general settings.');
    } finally {
      setGeneralSaveLoading(false);
    }
  };

  // Submit RBAC changes
  const handleSaveRBAC = async (e: React.FormEvent) => {
    e.preventDefault();
    setRbacSaveLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const matrixPayload = permissions.map((p) => ({
        role: p.role.role,
        resource: p.resource,
        access: p.access,
      }));

      const res = await fetch(`${API_URL}/api/v1/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matrix: matrixPayload }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update permissions');
      }

      setSuccessMsg('RBAC permissions matrix updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchAllSettings(); // Refresh state
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving permissions.');
    } finally {
      setRbacSaveLoading(false);
    }
  };

  // Filter out Admin from interactive matrix because Admins always have WRITE/Full access bypass
  const rolesToDisplay = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

  // Helper to find specific role-resource permission
  const getPermissionAccess = (roleName: string, resource: string): string => {
    const perm = permissions.find((p) => p.role.role === roleName && p.resource === resource);
    return perm ? perm.access : 'NONE';
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5B89C9]" />
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <ShieldAlert className="h-12 w-12 text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text tracking-tight mb-2">
          Access Restricted
        </h2>
        <p className="text-[14px] text-secondary-text max-w-md mb-8">
          Only administrators can access the settings page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 h-11 px-6 rounded-md bg-[#5B89C9] hover:bg-[#4E7AB8] text-[14px] font-semibold text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-text tracking-tight">Settings</h1>
        <p className="text-[14px] text-secondary-text mt-1">
          Configure depot details and manage roles permissions matrix
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT PANEL: GENERAL SETTINGS */}
        <form
          onSubmit={handleSaveGeneral}
          className="lg:col-span-4 space-y-5 bg-surface border border-border p-6 rounded-lg shadow-xs self-start"
        >
          <h3 className="text-[14px] font-bold text-secondary-text uppercase tracking-wider">
            General
          </h3>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="depot-name" className="text-sm font-semibold text-primary-text">
              Depot Name
            </label>
            <input
              id="depot-name"
              type="text"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="currency" className="text-sm font-semibold text-primary-text">
              Currency
            </label>
            <input
              id="currency"
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="distance-unit" className="text-sm font-semibold text-primary-text">
              Distance Unit
            </label>
            <input
              id="distance-unit"
              type="text"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={generalSaveLoading || loading}
            className="w-full h-11 rounded-md bg-[#5B89C9] hover:bg-[#4E7AB8] text-[14px] font-semibold text-white transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
          >
            {generalSaveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Save changes</span>
          </button>
        </form>

        {/* RIGHT PANEL: RBAC MATRIX */}
        <form
          onSubmit={handleSaveRBAC}
          className="lg:col-span-8 bg-surface border border-border p-6 rounded-lg shadow-xs overflow-hidden flex flex-col"
        >
          <h3 className="text-[14px] font-bold text-secondary-text uppercase tracking-wider mb-4">
            Role-Based Access (RBAC)
          </h3>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[11px] font-bold text-secondary-text uppercase tracking-wider">
                    <th className="px-4 py-3">Role</th>
                    {RESOURCES.map((res) => (
                      <th key={res} className="px-4 py-3 text-center">
                        {RESOURCE_DISPLAY_NAMES[res]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rolesToDisplay.map((roleKey) => (
                    <tr key={roleKey} className="hover:bg-background/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-primary-text">
                        {ROLE_DISPLAY_NAMES[roleKey]}
                      </td>
                      {RESOURCES.map((resource) => {
                        const currentAccess = getPermissionAccess(roleKey, resource);
                        return (
                          <td key={resource} className="px-4 py-3.5 text-center">
                            <select
                              value={currentAccess}
                              onChange={(e) =>
                                handleAccessChange(roleKey, resource, e.target.value)
                              }
                              className="bg-background border border-border rounded px-2 py-1 text-xs text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-center font-medium"
                            >
                              <option value="WRITE">✓ (Write)</option>
                              <option value="READ">view (Read)</option>
                              <option value="NONE">– (None)</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button
            type="submit"
            disabled={rbacSaveLoading || loading}
            className="w-full lg:w-48 h-11 rounded-md bg-[#5B89C9] hover:bg-[#4E7AB8] text-[14px] font-semibold text-white transition-colors flex items-center justify-center space-x-1.5 shadow-sm mt-6 self-end"
          >
            {rbacSaveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Save permissions</span>
          </button>
        </form>
      </div>
    </div>
  );
}
