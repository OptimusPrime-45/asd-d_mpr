'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { TripLifecycle } from '@/components/trips/TripLifecycle';
import { CreateTripForm } from '@/components/trips/CreateTripForm';
import { LiveBoard, Trip } from '@/components/trips/LiveBoard';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

export default function TripDispatcherPage() {
  const { user, token, logout } = useAuth();
  const API_URL = getApiUrl();

  // Form state
  const [source, setSource] = useState('');
  const [sourceLat, setSourceLat] = useState<number | null>(null);
  const [sourceLng, setSourceLng] = useState<number | null>(null);
  const [destination, setDestination] = useState('');
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLng, setDestLng] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState('');
  const [driver, setDriver] = useState('');
  const [weight, setWeight] = useState('');
  const [distance, setDistance] = useState('');

  // Data state
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [liveTrips, setLiveTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Auto-calculate road distance via OSRM whenever both pins are set
  useEffect(() => {
    if (sourceLat === null || sourceLng === null || destLat === null || destLng === null) return;

    const fetchRoadDistance = async () => {
      setDistanceLoading(true);
      setDistance('');
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${sourceLng},${sourceLat};${destLng},${destLat}?overview=false`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error('OSRM unavailable');
        const data = await res.json();
        const metres = data.routes?.[0]?.distance;
        if (metres !== undefined) {
          // Convert metres → km, round to 1 decimal
          setDistance((metres / 1000).toFixed(1));
        }
      } catch {
        // Silently fall through — user can type distance manually
      } finally {
        setDistanceLoading(false);
      }
    };

    fetchRoadDistance();
  }, [sourceLat, sourceLng, destLat, destLng]);

  const statusColorMap: Record<string, string> = {
    Draft: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-gray-100 text-gray-700 border-gray-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setPageError(null);
    const companyId = (user as any)?.companyId || 1;

    try {
      const [vehRes, drvRes, tripRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/vehicles`, { headers: authHeaders }),
        fetch(`${API_URL}/api/v1/drivers`, { headers: authHeaders }),
        fetch(`${API_URL}/api/v1/trips/recent/${companyId}`, { headers: authHeaders }),
      ]);

      if (vehRes.status === 401 || drvRes.status === 401 || tripRes.status === 401) {
        logout();
        return;
      }

      if (!vehRes.ok || !drvRes.ok) {
        throw new Error('Failed to load fleet data. Please try again.');
      }

      const vehData = await vehRes.json();
      const drvData = await drvRes.json();

      const vehicles = (vehData.data || []).filter((v: any) => v.status === 'Available');
      const drivers = (drvData.data || []).filter((d: any) => d.status === 'Available');

      setAvailableVehicles(vehicles);
      setAvailableDrivers(drivers);

      if (vehicles.length > 0) setVehicle(vehicles[0].reg_no);
      if (drivers.length > 0) setDriver(drivers[0].driver_id.toString());

      // Trips — gracefully handle 403 (e.g., TRIPS=NONE but can still dispatch)
      if (tripRes.ok) {
        const tripData = await tripRes.json();
        const formattedTrips = (tripData.data || []).map((t: any) => ({
          id: t.tripId,
          displayId: `TR${t.tripId.toString().padStart(3, '0')}`,
          source: t.src,
          destination: t.dest,
          status: t.status,
          statusColor: statusColorMap[t.status] || 'bg-gray-100 text-gray-700 border-gray-200',
          vehicleDriver: `${t.regNo || 'Unassigned'} / ${t.driverName?.toUpperCase() || 'UNASSIGNED'}`,
          time:
            t.status === 'Dispatched'
              ? 'In transit'
              : t.status === 'Draft'
                ? 'Awaiting dispatch'
                : '—',
        }));
        setLiveTrips(formattedTrips);
      } else {
        setLiveTrips([]);
      }
    } catch (e: any) {
      setPageError(e.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, fetchDashboardData]);

  const handleStatusUpdate = async (tripId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/trips/${tripId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ trip_status: newStatus }),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to update trip status to "${newStatus}"`);
      }

      fetchDashboardData();
    } catch (error: any) {
      setPageError(error.message || 'Failed to update trip status.');
    }
  };

  const handleDispatch = async () => {
    if (!source || !destination || !vehicle || !driver || !weight || !distance) return;

    setDispatchLoading(true);
    setDispatchError(null);

    try {
      const body: Record<string, any> = {
        reg_no: vehicle,
        driver_id: parseInt(driver, 10),
        src: source,
        dest: destination,
        cargo_weight: parseFloat(weight),
        trip_dist: parseFloat(distance),
      };

      // Include coordinates if the user pinned a location
      if (sourceLat !== null && sourceLng !== null) {
        body.src_lat = sourceLat;
        body.src_lng = sourceLng;
      }
      if (destLat !== null && destLng !== null) {
        body.dest_lat = destLat;
        body.dest_lng = destLng;
      }

      const res = await fetch(`${API_URL}/api/v1/trips`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create trip. Please check your inputs.');
      }

      // Reset form
      setSource('');
      setSourceLat(null);
      setSourceLng(null);
      setDestination('');
      setDestLat(null);
      setDestLng(null);
      setWeight('');
      setDistance('');
      setDispatchError(null);
      fetchDashboardData();
    } catch (error: any) {
      setDispatchError(error.message || 'Failed to dispatch trip.');
    } finally {
      setDispatchLoading(false);
    }
  };

  const selectedTripStatus = liveTrips.find((t) => t.id === selectedTripId)?.status || 'Draft';

  return (
    <RouteGuard resource="TRIPS" required="READ">
      <div className="flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-text tracking-tight">Trip Dispatcher</h1>
            <p className="text-[14px] text-secondary-text mt-1">
              Manage and dispatch fleet trips in real-time.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            title="Refresh"
            className="p-2 border border-border rounded-md hover:bg-background text-secondary-text transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Page-level error */}
        {pageError && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{pageError}</span>
            <button
              onClick={() => setPageError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-secondary-text">Loading trip data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Lifecycle + Create Form */}
            <div className="lg:col-span-4 flex flex-col space-y-5">
              <TripLifecycle currentStatus={selectedTripStatus} />
              <CreateTripForm
                source={source}
                setSource={setSource}
                sourceLat={sourceLat}
                sourceLng={sourceLng}
                setSourceCoords={(lat, lng) => {
                  setSourceLat(lat);
                  setSourceLng(lng);
                }}
                destination={destination}
                setDestination={setDestination}
                destLat={destLat}
                destLng={destLng}
                setDestCoords={(lat, lng) => {
                  setDestLat(lat);
                  setDestLng(lng);
                }}
                vehicle={vehicle}
                setVehicle={setVehicle}
                driver={driver}
                setDriver={setDriver}
                weight={weight}
                setWeight={setWeight}
                distance={distance}
                setDistance={setDistance}
                availableVehicles={availableVehicles}
                availableDrivers={availableDrivers}
                onDispatch={handleDispatch}
                dispatchError={dispatchLoading ? 'Dispatching...' : dispatchError}
                distanceLoading={distanceLoading}
              />
            </div>

            {/* Right Column: Live Board */}
            <div className="lg:col-span-8">
              <LiveBoard
                trips={liveTrips}
                onStatusUpdate={handleStatusUpdate}
                selectedTripId={selectedTripId}
                onSelectTrip={setSelectedTripId}
              />
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
