import React from 'react';
import { Clock, MapPin, Navigation, Play, CheckCircle2, XCircle } from 'lucide-react';

export interface Trip {
  id: number;
  displayId: string;
  source: string;
  destination: string;
  status: string;
  statusColor: string;
  vehicleDriver: string;
  time: string;
}

interface LiveBoardProps {
  trips: Trip[];
  onStatusUpdate: (tripId: number, newStatus: string) => void;
  selectedTripId: number | null;
  onSelectTrip: (tripId: number) => void;
}

export function LiveBoard({ trips, onStatusUpdate, selectedTripId, onSelectTrip }: LiveBoardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50">
        <h2 className="text-sm font-bold text-primary-text uppercase tracking-wider flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" /> Live Board
        </h2>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => onSelectTrip(trip.id)}
            className={`border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors shadow-sm flex flex-col gap-3 group relative ${
              selectedTripId === trip.id
                ? 'border-primary ring-1 ring-primary bg-primary/5'
                : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-bold text-primary-text">{trip.displayId}</span>
                <div className="flex items-center gap-2 text-sm text-secondary-text mt-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>
                    {trip.source} <span className="mx-1 text-gray-300">→</span> {trip.destination}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-secondary-text uppercase tracking-wider block">
                  {trip.vehicleDriver}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${trip.statusColor}`}
                >
                  {trip.status}
                </span>

                {/* Status Update Action Buttons */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                  {trip.status === 'Draft' && (
                    <>
                      <button
                        onClick={() => onStatusUpdate(trip.id, 'Dispatched')}
                        className="p-1 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                        title="Dispatch Trip"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStatusUpdate(trip.id, 'Cancelled')}
                        className="p-1 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                        title="Cancel Trip"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {trip.status === 'Dispatched' && (
                    <>
                      <button
                        onClick={() => onStatusUpdate(trip.id, 'Completed')}
                        className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors"
                        title="Complete Trip"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStatusUpdate(trip.id, 'Cancelled')}
                        className="p-1 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                        title="Cancel Trip"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <span className="text-xs font-medium text-secondary-text flex items-center gap-1.5">
                {trip.status === 'Dispatched' ? <Clock className="w-3.5 h-3.5" /> : null}
                {trip.time}
              </span>
            </div>
          </div>
        ))}

        {trips.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <Navigation className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm font-medium">No active trips found.</p>
            <p className="text-xs mt-1">Create a new trip to see it on the live board.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-gray-50 text-center">
        <p className="text-xs font-medium text-secondary-text">
          On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
        </p>
      </div>
    </div>
  );
}
