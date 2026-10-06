import React, { useState } from 'react';
import { AlertCircle, X, CheckCircle2, MapPin, Loader2 } from 'lucide-react';
import { LocationPickerModal } from './LocationPickerModal';

interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

interface CreateTripFormProps {
  source: string;
  setSource: (val: string) => void;
  sourceLat: number | null;
  sourceLng: number | null;
  setSourceCoords: (lat: number, lng: number) => void;
  destination: string;
  setDestination: (val: string) => void;
  destLat: number | null;
  destLng: number | null;
  setDestCoords: (lat: number, lng: number) => void;
  vehicle: string;
  setVehicle: (val: string) => void;
  driver: string;
  setDriver: (val: string) => void;
  weight: string;
  setWeight: (val: string) => void;
  distance: string;
  setDistance: (val: string) => void;
  distanceLoading: boolean;
  availableVehicles: any[];
  availableDrivers: any[];
  onDispatch: () => void;
  dispatchError: string | null;
}

export function CreateTripForm({
  source,
  setSource,
  sourceLat,
  sourceLng,
  setSourceCoords,
  destination,
  setDestination,
  destLat,
  destLng,
  setDestCoords,
  vehicle,
  setVehicle,
  driver,
  setDriver,
  weight,
  setWeight,
  distance,
  setDistance,
  distanceLoading,
  availableVehicles,
  availableDrivers,
  onDispatch,
  dispatchError,
}: CreateTripFormProps) {
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  const selectedVehicleData = availableVehicles.find((v) => v.reg_no === vehicle);
  const capacity = selectedVehicleData?.load_capacity || 0;
  const currentWeight = parseFloat(weight) || 0;

  const isOverweight = currentWeight > capacity;
  const canDispatch =
    source && destination && vehicle && driver && weight && distance && !isOverweight;

  return (
    <>
      <div className="bg-surface rounded-xl border border-border shadow-sm flex flex-col">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-bold text-primary-text uppercase tracking-wider">
            Create Trip
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Dispatch Error Banner */}
          {dispatchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2.5 items-start text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="text-red-800 font-medium">{dispatchError}</span>
            </div>
          )}

          {/* Source */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase">Source</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Gandhinagar Depot"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowSourcePicker(true)}
                title="Pick on map"
                className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
                  sourceLat !== null
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-background border-border text-secondary-text hover:border-primary hover:text-primary'
                }`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
            {sourceLat !== null && (
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {sourceLat.toFixed(4)}, {sourceLng?.toFixed(4)} — pinned
              </p>
            )}
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase">Destination</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Ahmedabad Hub"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowDestPicker(true)}
                title="Pick on map"
                className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-colors shrink-0 ${
                  destLat !== null
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-background border-border text-secondary-text hover:border-primary hover:text-primary'
                }`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>
            {destLat !== null && (
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {destLat.toFixed(4)}, {destLng?.toFixed(4)} — pinned
              </p>
            )}
          </div>

          {/* Vehicle */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase">
              Vehicle (Available Only)
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              {availableVehicles.map((v) => (
                <option key={v.reg_no} value={v.reg_no}>
                  {v.reg_no} — {v.load_capacity} kg cap
                </option>
              ))}
              {availableVehicles.length === 0 && <option value="">No vehicles available</option>}
            </select>
          </div>

          {/* Driver */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase">
              Driver (Available Only)
            </label>
            <select
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              {availableDrivers.map((d) => (
                <option key={d.driver_id} value={d.driver_id.toString()}>
                  {d.user?.name || 'Unknown Driver'} ({d.license_no})
                </option>
              ))}
              {availableDrivers.length === 0 && <option value="">No drivers available</option>}
            </select>
          </div>

          {/* Cargo Weight */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase">
              Cargo Weight (kg)
            </label>
            <input
              type="number"
              placeholder="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Distance */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary-text uppercase flex items-center gap-1.5">
              Planned Distance (km)
              {distanceLoading && (
                <span className="text-[10px] text-primary font-semibold normal-case tracking-normal flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Calculating road distance…
                </span>
              )}
              {!distanceLoading && distance && sourceLat !== null && destLat !== null && (
                <span className="text-[10px] text-emerald-600 font-semibold normal-case tracking-normal flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Auto-filled via road routing
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder={distanceLoading ? '' : '0'}
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                disabled={distanceLoading}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  distanceLoading
                    ? 'border-border bg-black/5 text-secondary-text cursor-not-allowed opacity-70'
                    : 'border-border'
                }`}
              />
              {distanceLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 text-secondary-text text-[12px] font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Fetching road distance…</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Capacity Validation */}
          {currentWeight > 0 &&
            selectedVehicleData &&
            (isOverweight ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2.5 items-start text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col text-red-900">
                  <span className="font-medium">
                    Capacity: {capacity} kg — Cargo: {currentWeight} kg
                  </span>
                  <span className="font-bold text-red-600 mt-0.5 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Exceeds by {currentWeight - capacity} kg — blocked
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2.5 items-start text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div className="flex flex-col text-green-900">
                  <span className="font-medium">
                    Capacity: {capacity} kg — Cargo: {currentWeight} kg
                  </span>
                  <span className="font-bold text-green-600 mt-0.5">
                    Within limits. Ready to dispatch.
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="p-5 border-t border-border flex gap-3 rounded-b-xl">
          <button
            disabled={!canDispatch}
            onClick={onDispatch}
            className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-colors text-sm ${
              canDispatch
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canDispatch ? '↗ Dispatch Trip' : 'Fill all fields to dispatch'}
          </button>
          <button
            onClick={() => {
              setSource('');
              setDestination('');
              setWeight('');
              setDistance('');
            }}
            className="px-4 py-2 border border-border bg-background text-secondary-text hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Source Location Picker */}
      <LocationPickerModal
        isOpen={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        title="Pick Source Location"
        initialName={source}
        onConfirm={(result) => {
          setSource(result.name);
          setSourceCoords(result.lat, result.lng);
          setShowSourcePicker(false);
        }}
      />

      {/* Destination Location Picker */}
      <LocationPickerModal
        isOpen={showDestPicker}
        onClose={() => setShowDestPicker(false)}
        title="Pick Destination Location"
        initialName={destination}
        onConfirm={(result) => {
          setDestination(result.name);
          setDestCoords(result.lat, result.lng);
          setShowDestPicker(false);
        }}
      />
    </>
  );
}
