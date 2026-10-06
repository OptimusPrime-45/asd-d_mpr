"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Driver } from "./DriverTable";

interface AddDriverFormProps {
  onSuccess: (driver: Driver) => void;
  onCancel: () => void;
}

export function AddDriverForm({ onSuccess, onCancel }: AddDriverFormProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    license_no: "",
    license_type: "",
    contact_number: "",
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      
      // Assume safety score is 100 initially and expiry is +5 years
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);

      const payload = {
        ...formData,
        safety_score: 100.0,
        expiry_date: futureDate.toISOString(),
        trip_completion_rate: 0,
      };

      const res = await fetch(`${API_URL}/api/v1/drivers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to add driver");
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
        {/* User Info */}
        <div className="space-y-1 sm:col-span-2">
          <h3 className="text-sm font-semibold text-primary-text border-b border-border pb-1">Personal Details</h3>
        </div>
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-primary-text">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="contact_number" className="text-sm font-medium text-primary-text">
            Contact Number
          </label>
          <input
            type="text"
            id="contact_number"
            name="contact_number"
            required
            value={formData.contact_number}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. 9876543210"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-primary-text">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. driver@transitops.com"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-primary-text">
            Temporary Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="min 6 characters"
          />
        </div>

        {/* License Info */}
        <div className="space-y-1 sm:col-span-2 pt-2">
          <h3 className="text-sm font-semibold text-primary-text border-b border-border pb-1">License Details</h3>
        </div>
        <div className="space-y-1">
          <label htmlFor="license_no" className="text-sm font-medium text-primary-text">
            License No.
          </label>
          <input
            type="text"
            id="license_no"
            name="license_no"
            required
            value={formData.license_no}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. DL-12345"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="license_type" className="text-sm font-medium text-primary-text">
            Category
          </label>
          <input
            type="text"
            id="license_type"
            name="license_type"
            required
            value={formData.license_type}
            onChange={handleChange}
            className="block h-10 w-full rounded-md border border-border bg-black/5 px-3 text-sm text-primary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. LMV"
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
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
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
          {isSubmitting ? "Adding..." : "Add Driver"}
        </button>
      </div>
    </form>
  );
}
