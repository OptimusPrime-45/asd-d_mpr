'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  resource: string;
  required?: 'READ' | 'WRITE';
  children: React.ReactNode;
}

export function RouteGuard({ resource, required = 'READ', children }: RouteGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5B89C9] border-t-transparent" />
      </div>
    );
  }

  const allowed = hasPermission(resource, required);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <ShieldAlert className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary-text tracking-tight mb-2">
          Access Restricted
        </h2>
        <p className="text-[14px] text-secondary-text max-w-md mb-8">
          You do not have the required permissions ({required.toLowerCase()} access to{' '}
          {resource.toLowerCase()}) to view this resource. Please contact your administrator if you
          believe this is an error.
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

  return <>{children}</>;
}
