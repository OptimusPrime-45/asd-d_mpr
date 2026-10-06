'use client';

import React, { useState } from 'react';
import { Hexagon, ChevronDown, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials. Please try again.');
      }

      // Successful login
      login(data.data.user, data.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 mb-6">
          <Hexagon className="h-6 w-6 text-primary" strokeWidth={2.5} />
          <span className="text-xl font-semibold text-primary-text tracking-tight">FleetOps</span>
        </div>
        <h2 className="text-[24px] font-semibold tracking-tight text-primary-text">Welcome back</h2>
        <p className="text-[16px] text-secondary-text">Sign in to continue to FleetOps</p>
      </div>

      {/* Form */}
      <form className="flex flex-col space-y-5" onSubmit={handleSubmit}>
        {/* Error State */}
        {error && (
          <div className="flex items-center space-x-3 rounded-md bg-error/10 border border-error/20 px-4 py-3 text-error animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-[14px] font-medium leading-tight">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="email" className="text-[14px] font-medium text-primary-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-md bg-surface border border-border px-4 py-2 text-[16px] text-primary-text placeholder:text-secondary-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="password" className="text-[14px] font-medium text-primary-text">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-md bg-surface border border-border px-4 py-2 text-[16px] text-primary-text placeholder:text-secondary-text/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Role */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="role" className="text-[14px] font-medium text-primary-text">
            Role
          </label>
          <div className="relative">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 rounded-md bg-surface border border-border px-4 py-2 pr-10 text-[16px] text-primary-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer disabled:opacity-50"
              required
              disabled={isLoading}
            >
              <option value="ADMIN">Admin</option>
              <option value="DRIVER">Driver</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="SAFETY_OFFICER">Safety Officer</option>
              <option value="FINANCIAL_ANALYST">Financial Analyst</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Remember */}
        <div className="flex items-center pt-1">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                disabled={isLoading}
                className="peer appearance-none w-4 h-4 rounded-sm border border-border bg-surface checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
              />
              <svg
                className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                viewBox="0 0 14 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5L4.5 8.5L13 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-[14px] text-secondary-text group-hover:text-primary-text transition-colors">
              Remember me
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-12 w-full rounded-md bg-primary text-[16px] font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[14px] text-secondary-text pt-4">
        © 2026 FleetOps. All rights reserved.
      </p>
    </div>
  );
}
