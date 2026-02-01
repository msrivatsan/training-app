'use client';

import { useEffect, useState } from 'react';
import type { ProgressionInsight, ExerciseLibrary } from '@/lib/types';

interface ProgressionInsightsProps {
  userId: string;
  limit?: number;
}

export default function ProgressionInsights({ userId, limit = 3 }: ProgressionInsightsProps) {
  const [insights, setInsights] = useState<ProgressionInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch(`/api/progression/insights?userId=${userId}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setInsights(data.insights || []);
        }
      } catch (error) {
        console.error('Failed to fetch progression insights:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [userId, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Progression Insights</h3>
        <p className="text-gray-600">
          Complete a few workouts to see personalized insights about your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        Progression Insights
      </h3>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: ProgressionInsight }) {
  const getIcon = (type: ProgressionInsight['type']) => {
    switch (type) {
      case 'weight_gain':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'strength_increase':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'milestone_upcoming':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'pr_potential':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'consistency':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = (type: ProgressionInsight['type']) => {
    switch (type) {
      case 'weight_gain':
        return 'bg-green-50 border-green-200';
      case 'strength_increase':
        return 'bg-purple-50 border-purple-200';
      case 'milestone_upcoming':
        return 'bg-yellow-50 border-yellow-200';
      case 'pr_potential':
        return 'bg-red-50 border-red-200';
      case 'consistency':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`${getBgColor(insight.type)} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{insight.message}</p>

          {insight.prediction && (
            <div className="mt-2 text-xs text-gray-600">
              {insight.prediction.weight_kg && (
                <span className="font-semibold">Target: {insight.prediction.weight_kg}kg</span>
              )}
              {insight.prediction.timeframe && (
                <span className="ml-2">({insight.prediction.timeframe})</span>
              )}
              {insight.prediction.confidence && (
                <span className="ml-2 text-gray-500">
                  {Math.round(insight.prediction.confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}

          {insight.action && (
            <div className="mt-2">
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                {insight.action} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
