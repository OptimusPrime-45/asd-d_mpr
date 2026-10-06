'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Plus, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { RouteGuard } from '@/components/layout/RouteGuard';

interface FuelLog {
  id: number;
  reg_no: string;
  litres: number;
  fuel_cost: number;
  date: string;
}

interface Expense {
  id: number;
  trip_id: number;
  reg_no: string;
  maintenance: number;
  toll: number;
  others: number;
  trip?: {
    id: number;
    reg_no: string;
    trip_status: string;
  };
}

interface Vehicle {
  reg_no: string;
  vehicle_model: string;
  status: string;
}

interface Trip {
  tripId: number;
  regNo: string;
  driverName: string;
  status: string;
}

export default function FuelExpensesPage() {
  const { user, token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Data lists
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Loading / Error
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states - Log Fuel
  const [fuelRegNo, setFuelRegNo] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().substring(0, 10));
  const [fuelSubmitLoading, setFuelSubmitLoading] = useState(false);
  const [fuelSubmitError, setFuelSubmitError] = useState<string | null>(null);

  // Form states - Add Expense
  const [expenseTripId, setExpenseTripId] = useState('');
  const [expenseToll, setExpenseToll] = useState('');
  const [expenseMaint, setExpenseMaint] = useState('');
  const [expenseOther, setExpenseOther] = useState('');
  const [expenseSubmitLoading, setExpenseSubmitLoading] = useState(false);
  const [expenseSubmitError, setExpenseSubmitError] = useState<string | null>(null);

  // Fetch all lists
  const fetchData = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    const companyId = (user as any).companyId || 1;

    try {
      const [fuelRes, expenseRes, vehicleRes, tripsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/fuel`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/v1/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/v1/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${API_URL}/api/v1/trips/recent/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (!fuelRes.ok || !expenseRes.ok) {
        throw new Error('Failed to fetch fuel/expense data from the server.');
      }

      const fuelJson = await fuelRes.json();
      const expenseJson = await expenseRes.json();

      let vehicleJson: { data: Vehicle[] } = { data: [] };
      if (vehicleRes && vehicleRes.ok) {
        vehicleJson = await vehicleRes.json();
      }

      let tripsJson: { data: Trip[] } = { data: [] };
      if (tripsRes && tripsRes.ok) {
        tripsJson = await tripsRes.json();
      }

      setFuelLogs(fuelJson.data || []);
      setExpenses(expenseJson.data || []);
      setVehicles(vehicleJson.data || []);
      setTrips(tripsJson.data || []);

      // Set defaults for forms
      if (vehicleJson.data && vehicleJson.data.length > 0) {
        setFuelRegNo(vehicleJson.data[0].reg_no);
      }
      if (tripsJson.data && tripsJson.data.length > 0) {
        setExpenseTripId(String(tripsJson.data[0].tripId));
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  // Handle Fuel Submit
  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelSubmitLoading(true);
    setFuelSubmitError(null);

    try {
      const parsedLitres = parseFloat(fuelLitres);
      const parsedPrice = parseFloat(fuelPricePerLitre);

      if (isNaN(parsedLitres) || parsedLitres <= 0) {
        throw new Error('Litres must be a positive number');
      }
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Price per litre must be a positive number');
      }

      const calculatedCost = parsedLitres * parsedPrice;

      const bodyData = {
        reg_no: fuelRegNo,
        litres: parsedLitres,
        fuel_cost: calculatedCost,
        date: new Date(fuelDate).toISOString(),
      };

      const res = await fetch(`${API_URL}/api/v1/fuel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to record fuel log');
      }

      // Reset & refresh
      setIsFuelModalOpen(false);
      setFuelLitres('');
      setFuelPricePerLitre('');
      fetchData();
    } catch (err: any) {
      setFuelSubmitError(err.message || 'An error occurred');
    } finally {
      setFuelSubmitLoading(false);
    }
  };

  // Handle Expense Submit
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSubmitLoading(true);
    setExpenseSubmitError(null);

    try {
      const parsedTripId = parseInt(expenseTripId, 10);
      const parsedToll = parseFloat(expenseToll || '0');
      const parsedMaint = parseFloat(expenseMaint || '0');
      const parsedOther = parseFloat(expenseOther || '0');

      if (isNaN(parsedTripId)) {
        throw new Error('Please select a trip');
      }
      if (isNaN(parsedToll) || parsedToll < 0) {
        throw new Error('Toll must be non-negative');
      }
      if (isNaN(parsedMaint) || parsedMaint < 0) {
        throw new Error('Maintenance must be non-negative');
      }
      if (isNaN(parsedOther) || parsedOther < 0) {
        throw new Error('Other costs must be non-negative');
      }

      // Find the vehicle registration number assigned to this trip
      const selectedTrip = trips.find((t) => String(t.tripId) === expenseTripId);
      if (!selectedTrip) {
        throw new Error('Selected trip not found');
      }

      const bodyData = {
        trip_id: parsedTripId,
        reg_no: selectedTrip.regNo,
        toll: parsedToll,
        maintenance: parsedMaint,
        others: parsedOther,
      };

      const res = await fetch(`${API_URL}/api/v1/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to record expense');
      }

      // Reset & refresh
      setIsExpenseModalOpen(false);
      setExpenseToll('');
      setExpenseMaint('');
      setExpenseOther('');
      fetchData();
    } catch (err: any) {
      setExpenseSubmitError(err.message || 'An error occurred');
    } finally {
      setExpenseSubmitLoading(false);
    }
  };

  // Date Formatter: 05 Jul 2026
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Dynamic calculations
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.fuel_cost, 0);
  const totalOtherExpenses = expenses.reduce(
    (acc, curr) => acc + curr.toll + curr.others + curr.maintenance,
    0
  );
  const totalOperationalCost = totalFuelCost + totalOtherExpenses;

  // Selected trip for reactive vehicle field
  const selectedTripObj = trips.find((t) => String(t.tripId) === expenseTripId);

  return (
    <RouteGuard resource="FUEL_EXPENSE" required="READ">
      <div className="space-y-6">
        {/* HEADER SECTION WITH ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary-text tracking-tight">
              Fuel & Expenses
            </h1>
            <p className="text-[14px] text-secondary-text mt-1">
              Manage fuel logs, toll costs, and other trip-related expenses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 bg-surface hover:bg-background border border-border rounded-md transition-colors text-secondary-text"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsFuelModalOpen(true)}
              className="h-10 px-4 rounded-md bg-primary hover:bg-primary/95 text-[14px] font-semibold text-white transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Log Fuel</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="h-10 px-4 rounded-md bg-primary hover:bg-primary/95 text-[14px] font-semibold text-white transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TWO MAIN LOGS TABLES */}
        <div className="grid grid-cols-1 gap-6">
          {/* 1. FUEL LOGS CARD */}
          <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border bg-surface/50">
              <h3 className="text-[15px] font-bold text-primary-text uppercase tracking-wider">
                Fuel Logs
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[11px] font-bold text-secondary-text uppercase tracking-wider">
                    <th className="px-5 py-3">Vehicle</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Liters</th>
                    <th className="px-5 py-3 text-right">Fuel Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading && fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-secondary-text">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-secondary-text">
                        No fuel logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    fuelLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-background/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-primary-text">{log.reg_no}</td>
                        <td className="px-5 py-3.5 text-secondary-text">{formatDate(log.date)}</td>
                        <td className="px-5 py-3.5 text-secondary-text font-medium">
                          {log.litres} L
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-primary-text">
                          ₹{log.fuel_cost.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. OTHER EXPENSES (TOLL / MISC) CARD */}
          <div className="bg-surface border border-border rounded-lg shadow-xs overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border bg-surface/50">
              <h3 className="text-[15px] font-bold text-primary-text uppercase tracking-wider">
                Other Expenses (Toll / Misc)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-[11px] font-bold text-secondary-text uppercase tracking-wider">
                    <th className="px-5 py-3">Trip</th>
                    <th className="px-5 py-3">Vehicle</th>
                    <th className="px-5 py-3 text-right">Toll</th>
                    <th className="px-5 py-3 text-right">Other</th>
                    <th className="px-5 py-3 text-right">Maint. (Linked)</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading && expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-secondary-text">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-secondary-text">
                        No other expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => {
                      const rowTotal = expense.toll + expense.others + expense.maintenance;
                      return (
                        <tr key={expense.id} className="hover:bg-background/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-primary-text">
                            TR{String(expense.trip_id).padStart(3, '0')}
                          </td>
                          <td className="px-5 py-3.5 text-secondary-text">{expense.reg_no}</td>
                          <td className="px-5 py-3.5 text-right text-secondary-text">
                            ₹{expense.toll.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right text-secondary-text">
                            ₹{expense.others.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right text-secondary-text">
                            ₹{expense.maintenance.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-primary-text">
                            ₹{rowTotal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TOTAL OPERATIONAL COST AGGREGATION FOOTER */}
        <div className="bg-surface border border-border p-5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <span className="text-[14px] font-bold text-secondary-text uppercase tracking-wider">
            Total Operational Cost (Auto) = Fuel + Maint + Toll + Other
          </span>
          <span className="text-2xl font-bold text-primary">
            ₹{totalOperationalCost.toLocaleString()}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. LOG FUEL MODAL */}
        <Modal
          isOpen={isFuelModalOpen}
          onClose={() => setIsFuelModalOpen(false)}
          title="Log Fuel Entry"
        >
          <form onSubmit={handleFuelSubmit} className="space-y-4">
            {fuelSubmitError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{fuelSubmitError}</span>
              </div>
            )}

            {/* Vehicle Dropdown */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="fuel-vehicle" className="text-sm font-semibold text-primary-text">
                Select Vehicle
              </label>
              <div className="relative">
                <select
                  id="fuel-vehicle"
                  value={fuelRegNo}
                  onChange={(e) => setFuelRegNo(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                  required
                >
                  {vehicles.map((v) => (
                    <option key={v.reg_no} value={v.reg_no}>
                      {v.reg_no} ({v.vehicle_model})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Input */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="fuel-date" className="text-sm font-semibold text-primary-text">
                Log Date
              </label>
              <input
                id="fuel-date"
                type="date"
                value={fuelDate}
                onChange={(e) => setFuelDate(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Litres Input */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="fuel-litres" className="text-sm font-semibold text-primary-text">
                  Litres
                </label>
                <input
                  id="fuel-litres"
                  type="number"
                  step="0.01"
                  placeholder="45"
                  value={fuelLitres}
                  onChange={(e) => setFuelLitres(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Price Per Litre Input */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="fuel-price" className="text-sm font-semibold text-primary-text">
                  Price per Litre (₹)
                </label>
                <input
                  id="fuel-price"
                  type="number"
                  step="0.01"
                  placeholder="95.50"
                  value={fuelPricePerLitre}
                  onChange={(e) => setFuelPricePerLitre(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Auto-calculated Total Cost */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-semibold text-primary-text">
                Total Cost (Auto-calculated)
              </label>
              <input
                type="text"
                value={`₹${(parseFloat(fuelLitres || '0') * parseFloat(fuelPricePerLitre || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="w-full h-11 bg-background/50 border border-border rounded-md px-3 text-[14px] text-secondary-text cursor-not-allowed font-medium"
                disabled
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setIsFuelModalOpen(false)}
                className="h-10 px-4 rounded-md border border-border text-[14px] font-semibold text-secondary-text hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={fuelSubmitLoading}
                className="h-10 px-5 rounded-md bg-primary hover:bg-primary/95 text-[14px] font-semibold text-white transition-colors flex items-center justify-center space-x-1.5"
              >
                {fuelSubmitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Entry</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* 4. ADD EXPENSE MODAL */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Add Other Expense"
        >
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            {expenseSubmitError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{expenseSubmitError}</span>
              </div>
            )}

            {/* Trip Dropdown */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="expense-trip" className="text-sm font-semibold text-primary-text">
                Select Trip
              </label>
              <div className="relative">
                <select
                  id="expense-trip"
                  value={expenseTripId}
                  onChange={(e) => setExpenseTripId(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                  required
                >
                  {trips.map((t) => (
                    <option key={t.tripId} value={t.tripId}>
                      TR{String(t.tripId).padStart(3, '0')} (Vehicle: {t.regNo}, Status: {t.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assigned Vehicle (Auto Reactive Read-Only Field) */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-sm font-semibold text-primary-text">
                Assigned Vehicle (Auto)
              </label>
              <input
                type="text"
                value={selectedTripObj ? selectedTripObj.regNo : 'No active vehicle'}
                className="w-full h-11 bg-background/50 border border-border rounded-md px-3 text-[14px] text-secondary-text cursor-not-allowed"
                disabled
              />
            </div>

            {/* Toll Cost */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="expense-toll" className="text-sm font-semibold text-primary-text">
                Toll Cost (₹)
              </label>
              <input
                id="expense-toll"
                type="number"
                placeholder="120"
                value={expenseToll}
                onChange={(e) => setExpenseToll(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Maintenance Cost */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="expense-maint" className="text-sm font-semibold text-primary-text">
                Maintenance Cost (₹)
              </label>
              <input
                id="expense-maint"
                type="number"
                placeholder="0"
                value={expenseMaint}
                onChange={(e) => setExpenseMaint(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Others Cost */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="expense-other" className="text-sm font-semibold text-primary-text">
                Other Expenses (₹)
              </label>
              <input
                id="expense-other"
                type="number"
                placeholder="0"
                value={expenseOther}
                onChange={(e) => setExpenseOther(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-md px-3 text-[14px] text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="h-10 px-4 rounded-md border border-border text-[14px] font-semibold text-secondary-text hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={expenseSubmitLoading}
                className="h-10 px-5 rounded-md bg-primary hover:bg-primary/95 text-[14px] font-semibold text-white transition-colors flex items-center justify-center space-x-1.5"
              >
                {expenseSubmitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Expense</span>
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </RouteGuard>
  );
}
