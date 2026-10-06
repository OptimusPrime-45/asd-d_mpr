import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Hexagon,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Fleet', href: '/fleet', icon: Truck },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Trips', href: '/trips', icon: Map },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', href: '/fuel', icon: Fuel },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const navItemResourceMap: Record<string, string> = {
  '/fleet': 'FLEET',
  '/drivers': 'DRIVERS',
  '/trips': 'TRIPS',
  '/maintenance': 'FLEET',
  '/fuel': 'FUEL_EXPENSE',
  '/analytics': 'ANALYTICS',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();

  const visibleNavigation = navigation.filter((item) => {
    if (item.href === '/dashboard') return true;
    if (item.href === '/settings') return user?.role === 'ADMIN';

    const resource = navItemResourceMap[item.href];
    if (!resource) return true;

    return hasPermission(resource, 'READ');
  });

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-surface text-primary-text">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Hexagon className="h-6 w-6 text-primary mr-2" />
        <span className="text-xl font-semibold tracking-tight">TransitOps</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-secondary-text hover:bg-black/5 hover:text-primary-text'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-secondary-text group-hover:text-primary-text'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
