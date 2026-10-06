'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: Record<string, 'WRITE' | 'READ' | 'NONE'>;
  hasPermission: (resource: string, access: 'READ' | 'WRITE') => boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, 'WRITE' | 'READ' | 'NONE'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_URL = getApiUrl();

  const fetchPermissions = async (authToken: string, userRole: string) => {
    if (userRole === 'ADMIN') {
      setPermissions({
        FLEET: 'WRITE',
        DRIVERS: 'WRITE',
        TRIPS: 'WRITE',
        FUEL_EXPENSE: 'WRITE',
        ANALYTICS: 'WRITE',
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/permissions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, 'WRITE' | 'READ' | 'NONE'> = {};
        json.data?.forEach((item: any) => {
          if (item.role?.role === userRole) {
            map[item.resource] = item.access as any;
          }
        });
        setPermissions(map);
      }
    } catch (e) {
      console.error('Failed to fetch user permissions', e);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('fleetops_token');
    const storedUser = localStorage.getItem('fleetops_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        fetchPermissions(storedToken, parsedUser.role);
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('fleetops_token', newToken);
    localStorage.setItem('fleetops_user', JSON.stringify(newUser));
    fetchPermissions(newToken, newUser.role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setPermissions({});
    localStorage.removeItem('fleetops_token');
    localStorage.removeItem('fleetops_user');
    router.push('/login');
  };

  const hasPermission = (resource: string, required: 'READ' | 'WRITE'): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const access = permissions[resource];
    if (!access || access === 'NONE') return false;
    if (required === 'WRITE') return access === 'WRITE';
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, permissions, hasPermission, login, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
