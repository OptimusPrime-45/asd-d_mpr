'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, CheckCircle2 } from 'lucide-react';

interface LocationResult {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onConfirm: (result: LocationResult) => void;
  initialName?: string;
}

// Dynamically import Leaflet to avoid SSR issues
let L: any = null;

export function LocationPickerModal({
  isOpen,
  onClose,
  title,
  onConfirm,
  initialName = '',
}: LocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState(initialName);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initMap = async () => {
      if (leafletMapRef.current) return; // Already initialized

      // Dynamic import
      const leafletModule = await import('leaflet');
      L = leafletModule.default;

      // Fix Leaflet default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Import CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Default to India center
      const map = L.map(mapRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        placeMarker(map, lat, lng);
        // Reverse geocode
        reverseGeocode(lat, lng);
      });

      leafletMapRef.current = map;
      setMapReady(true);

      // Small delay to allow map to settle
      setTimeout(() => map.invalidateSize(), 150);
    };

    initMap();

    return () => {
      // Don't destroy on re-render — only on full unmount
    };
  }, [isOpen]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen && leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
      setMapReady(false);
      setSelectedLocation(null);
      setSearchResults([]);
    }
  }, [isOpen]);

  const placeMarker = useCallback((map: any, lat: number, lng: number) => {
    if (!L) return;
    if (markerRef.current) {
      markerRef.current.remove();
    }
    const marker = L.marker([lat, lng]).addTo(map);
    markerRef.current = marker;
    map.setView([lat, lng], Math.max(map.getZoom(), 13));
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const name =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.display_name?.split(',')[0] ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const result: LocationResult = {
        name,
        lat,
        lng,
        displayName: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
      setSelectedLocation(result);
      setSearchQuery(name);
    } catch {
      const result: LocationResult = {
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng,
        displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
      setSelectedLocation(result);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const results: LocationResult[] = data.map((item: any) => ({
        name: item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
      }));
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectResult = useCallback(
    (result: LocationResult) => {
      setSelectedLocation(result);
      setSearchQuery(result.name);
      setSearchResults([]);
      if (leafletMapRef.current) {
        placeMarker(leafletMapRef.current, result.lat, result.lng);
      }
    },
    [placeMarker]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-primary-text">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-background rounded-md text-secondary-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-border shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-text pointer-events-none" />
              <input
                type="text"
                placeholder="Search location name (e.g. Ahmedabad, Mumbai Port...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-10 pl-9 pr-3 bg-background border border-border rounded-md text-[13px] text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Search
            </button>
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-md overflow-hidden shadow-md">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-primary/5 border-b border-border/50 last:border-0 transition-colors"
                >
                  <div className="text-[13px] font-semibold text-primary-text">{result.name}</div>
                  <div className="text-[11px] text-secondary-text truncate mt-0.5">
                    {result.displayName}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[340px]">
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '340px' }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] px-3 py-1.5 rounded-full pointer-events-none z-[500]">
            Click anywhere on the map to pin a location
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {selectedLocation ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-primary-text truncate">
                    {selectedLocation.name}
                  </div>
                  <div className="text-[11px] text-secondary-text">
                    {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-secondary-text">No location selected yet</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="h-9 px-4 border border-border rounded-md text-[13px] font-semibold text-secondary-text hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedLocation && onConfirm(selectedLocation)}
              disabled={!selectedLocation}
              className="h-9 px-5 bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
