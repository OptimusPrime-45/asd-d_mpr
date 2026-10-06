"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/api";
import { Vehicle } from "./VehicleTable";

interface AddVehicleFormProps {
  onSuccess: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

export function AddVehicleForm({ onSuccess, onCancel }: AddVehicleFormProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reg_no: "",
    vehicle_model: "",
    type: "",
    load_capacity: "",
    odometer_reading: "",
    cost: "",
    status: "Available",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const API_URL = getApiUrl();
      
      const payload = {
        ...formData,
        load_capacity: parseFloat(formData.load_capacity),
        odometer_reading: parseFloat(formData.odometer_reading),
        cost: parseFloat(formData.cost),
      };

      const res = await fetch(`${API_URL}/api/v1/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create vehicle");
      }

      onSuccess(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="reg_no" className="text-sm font-medium text-primary-text">
            Registration No.
          </label>
          <input
            type="text"
            id="reg_no"
            name="reg_no"
            required
            value={formData.reg_no}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. VAN-06"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="vehicle_model" className="text-sm font-medium text-primary-text">
            Name / Model
          </label>
          <input
            type="text"
            id="vehicle_model"
            name="vehicle_model"
            required
            value={formData.vehicle_model}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Ford Transit"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium text-primary-text">
            Vehicle Type
          </label>
          <input
            type="text"
            id="type"
            name="type"
            required
            value={formData.type}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Van, Truck"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="load_capacity" className="text-sm font-medium text-primary-text">
            Capacity (kg)
          </label>
          <input
            type="number"
            id="load_capacity"
            name="load_capacity"
            required
            min="1"
            value={formData.load_capacity}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. 500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="odometer_reading" className="text-sm font-medium text-primary-text">
            Odometer
          </label>
          <input
            type="number"
            id="odometer_reading"
            name="odometer_reading"
            required
            min="0"
            value={formData.odometer_reading}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. 15000"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cost" className="text-sm font-medium text-primary-text">
            Acq. Cost
          </label>
          <input
            type="number"
            id="cost"
            name="cost"
            required
            min="0"
            step="0.01"
            value={formData.cost}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. 45000"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="status" className="text-sm font-medium text-primary-text">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md px-4 py-2 text-sm font-medium text-secondary-text hover:bg-black/5 hover:text-primary-text transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Vehicle"}
        </button>
      </div>
    </form>
  );
}
