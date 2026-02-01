'use client';

import { useEffect, useState } from 'react';
import type { DeloadSchedule } from '@/lib/types';
import { getDeloadStatusMessage, isInDeloadWeek } from '@/lib/deload';

interface DeloadBadgeProps {
  userId: string;
  programId?: string;
  className?: string;
}

export default function DeloadBadge({ userId, programId, className = '' }: DeloadBadgeProps) {
  const [deload, setDeload] = useState<DeloadSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveDeload() {
      try {
        const url = programId
          ? `/api/deload/active?userId=${userId}&programId=${programId}`
          : `/api/deload/active?userId=${userId}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDeload(data.deload);
        }
      } catch (error) {
        console.error('Failed to fetch deload schedule:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveDeload();
  }, [userId, programId]);

  if (loading || !deload) {
    return null;
  }

  const isActive = deload.status === 'active' || isInDeloadWeek(deload);
  const isUpcoming = deload.status === 'upcoming' || deload.status === 'notified';

  if (!isActive && !isUpcoming) {
    return null;
  }

  const statusMessage = getDeloadStatusMessage(deload);

  return (
    <div className={className}>
      {isActive ? (
        <DeloadActiveBadge deload={deload} message={statusMessage} />
      ) : (
        <DeloadUpcomingBadge deload={deload} message={statusMessage} />
      )}
    </div>
  );
}

function DeloadActiveBadge({
  deload,
  message,
}: {
  deload: DeloadSchedule;
  message: string;
}) {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Deload Week</h3>
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-xs font-semibold">
              ACTIVE
            </span>
          </div>

          <p className="text-sm text-white/90 mt-1">{message}</p>

          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span>{deload.volume_reduction_percent}% volume reduction</span>
            </div>

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Same weights</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
        <p className="text-xs font-medium">Deload Guidelines:</p>
        <ul className="mt-2 text-xs space-y-1 text-white/80">
          <li>• Focus on form and technique</li>
          <li>• Keep the same weights as last week</li>
          <li>• Reduce number of sets by {deload.volume_reduction_percent}%</li>
          <li>• Listen to your body and recover</li>
        </ul>
      </div>
    </div>
  );
}

function DeloadUpcomingBadge({
  deload,
  message,
}: {
  deload: DeloadSchedule;
  message: string;
}) {
  const startDate = new Date(deload.scheduled_week_start);
  const daysUntil = Math.ceil(
    (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Deload Upcoming</h3>
          <p className="text-sm text-gray-600 mt-1">{message}</p>

          {daysUntil <= 7 && (
            <div className="mt-3 bg-white rounded-lg p-3 border border-yellow-200">
              <p className="text-xs font-medium text-gray-900 mb-2">
                Deload starts in {daysUntil} day{daysUntil === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-gray-600">
                Starting{' '}
                {startDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  You'll reduce volume by {deload.volume_reduction_percent}% while keeping the same
                  weights to allow recovery.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
