"use client";

import React from "react";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Topbar() {
  const { user, logout } = useAuth();

  // Helper to format role nicely (e.g. FLEET_MANAGER -> Fleet Manager)
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex flex-1">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-secondary-text" aria-hidden="true" />
          </div>
          <input
            type="search"
            name="search"
            id="search"
            className="block h-9 w-full rounded-md border-border bg-black/5 py-2 pl-10 pr-3 text-sm text-primary-text placeholder:text-secondary-text focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            placeholder="Search..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        {user && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-primary-text">{user.name}</p>
            </div>
            
            <div className="flex h-9 items-center justify-center space-x-2 rounded-full border border-border bg-black/5 pl-3 pr-1 py-1">
              <span className="text-xs font-medium text-secondary-text whitespace-nowrap">
                {formatRole(user.role)}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {getInitials(user.name)}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="text-secondary-text hover:text-error transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
