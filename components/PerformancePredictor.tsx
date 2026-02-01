'use client';

import { useEffect, useState } from 'react';
import type { MilestoneWithExercise, StrengthCurvePoint } from '@/lib/types';

interface PerformancePredictorProps {
  userId: string;
  exerciseLibraryId: string;
  exerciseName: string;
}

export default function PerformancePredictor({
  userId,
  exerciseLibraryId,
  exerciseName,
}: PerformancePredictorProps) {
  const [milestone, setMilestone] = useState<MilestoneWithExercise | null>(null);
  const [strengthCurve, setStrengthCurve] = useState<StrengthCurvePoint[]>([]);
  const [predicted1RM, setPredicted1RM] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch milestone and predictions
        const [milestoneRes, curveRes, predictionRes] = await Promise.all([
          fetch(`/api/progression/milestones?userId=${userId}&exerciseId=${exerciseLibraryId}`),
          fetch(`/api/progression/strength-curve?userId=${userId}&exerciseId=${exerciseLibraryId}`),
          fetch(`/api/progression/predict-1rm?userId=${userId}&exerciseId=${exerciseLibraryId}`),
        ]);

        if (milestoneRes.ok) {
          const milestoneData = await milestoneRes.json();
          setMilestone(milestoneData.milestone);
        }

        if (curveRes.ok) {
          const curveData = await curveRes.json();
          setStrengthCurve(curveData.curve || []);
        }

        if (predictionRes.ok) {
          const predictionData = await predictionRes.json();
          setPredicted1RM(predictionData.predicted_1rm);
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, exerciseLibraryId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          {exerciseName} Performance
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Current 1RM Prediction */}
        {predicted1RM && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated 1RM</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{predicted1RM}kg</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Based on recent sessions</p>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {strengthCurve.length} data points
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Tracker */}
        {milestone && milestone.status === 'in_progress' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Next Milestone</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {milestone.target_weight_kg}kg
                  {milestone.target_reps > 1 && ` × ${milestone.target_reps}`}
                </p>

                {milestone.weeks_to_achievement !== null && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estimated time</span>
                      <span className="font-medium text-gray-900">
                        {milestone.weeks_to_achievement === 0
                          ? 'Ready now!'
                          : milestone.weeks_to_achievement === 1
                          ? '1 week'
                          : `${milestone.weeks_to_achievement} weeks`}
                      </span>
                    </div>

                    {milestone.achievement_probability !== null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Probability</span>
                        <span className="font-medium text-gray-900">
                          {Math.round(milestone.achievement_probability * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {milestone.predicted_achievement_date && (
                  <p className="text-xs text-gray-500 mt-2">
                    Target date:{' '}
                    {new Date(milestone.predicted_achievement_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {predicted1RM && milestone.target_weight_kg && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Current: {predicted1RM}kg</span>
                  <span>Target: {milestone.target_weight_kg}kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (predicted1RM / milestone.target_weight_kg) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Strength Curve Visualization */}
        {strengthCurve.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Strength Progression</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <MiniStrengthChart curve={strengthCurve} />
            </div>
          </div>
        )}

        {/* No Data State */}
        {!predicted1RM && strengthCurve.length === 0 && (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-600 text-sm">
              Complete more workouts to see performance predictions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStrengthChart({ curve }: { curve: StrengthCurvePoint[] }) {
  if (curve.length === 0) return null;

  const maxValue = Math.max(...curve.map((p) => p.estimated_1rm_kg));
  const minValue = Math.min(...curve.map((p) => p.estimated_1rm_kg));
  const range = maxValue - minValue || 10; // Prevent division by zero

  return (
    <div className="space-y-2">
      {/* Simple bar chart */}
      <div className="flex items-end gap-1 h-32">
        {curve.slice(-10).map((point, index) => {
          const height = ((point.estimated_1rm_kg - minValue) / range) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center h-full">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{ height: `${Math.max(10, height)}%` }}
                  title={`${point.estimated_1rm_kg}kg on ${new Date(point.date).toLocaleDateString()}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{curve.length > 10 ? '...' : ''}</span>
        <span className="font-medium">
          {new Date(curve[curve.length - 1].date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
        <div>
          <span className="text-gray-500">Latest: </span>
          <span className="font-semibold text-gray-900">
            {curve[curve.length - 1].estimated_1rm_kg}kg
          </span>
        </div>
        {curve.length >= 2 && (
          <div>
            <span className="text-gray-500">Change: </span>
            <span
              className={`font-semibold ${
                curve[curve.length - 1].estimated_1rm_kg - curve[0].estimated_1rm_kg > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {curve[curve.length - 1].estimated_1rm_kg - curve[0].estimated_1rm_kg > 0 ? '+' : ''}
              {(curve[curve.length - 1].estimated_1rm_kg - curve[0].estimated_1rm_kg).toFixed(1)}
              kg
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
