import React from 'react';
import { Check, X, Truck, FileText } from 'lucide-react';
import clsx from 'clsx';

export function TripLifecycle({ currentStatus = 'Draft' }: { currentStatus?: string }) {
  const isDispatched = ['Dispatched', 'Completed'].includes(currentStatus);
  const isCompleted = currentStatus === 'Completed';
  const isCancelled = currentStatus === 'Cancelled';

  const steps = [
    {
      id: 'draft',
      label: 'Draft',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      icon: FileText,
      active: true,
    },
    {
      id: 'dispatched',
      label: 'Dispatched',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      icon: Truck,
      active: isDispatched,
    },
    {
      id: 'completed',
      label: 'Completed',
      color: 'bg-gray-800',
      textColor: 'text-gray-900',
      icon: Check,
      active: isCompleted,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      icon: X,
      active: isCancelled,
    },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm overflow-hidden">
      <h2 className="text-xs font-bold text-secondary-text uppercase tracking-widest mb-6 flex items-center gap-2">
        Trip Lifecycle
      </h2>
      <div className="relative flex justify-between w-full gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === steps.length - 1;
          const lineActive = steps[i].active && steps[i + 1]?.active;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center flex-1 group cursor-default text-center"
            >
              {!isLast && (
                <div
                  className={clsx(
                    'absolute top-4 left-1/2 w-full h-[3px] -z-10 transition-colors duration-500',
                    lineActive
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 opacity-80'
                      : 'bg-gray-200'
                  )}
                />
              )}

              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-surface transition-all duration-300 group-hover:scale-110',
                  step.active
                    ? `${step.color} text-white shadow-md shadow-black/10`
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
              </div>

              <span
                className={clsx(
                  'text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors duration-300',
                  step.active ? step.textColor : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
