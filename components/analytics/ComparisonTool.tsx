'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Calendar, TrendingUp, Scale, Dumbbell } from 'lucide-react';
import { format, subMonths, subDays } from 'date-fns';

interface ComparisonData {
  date: string;
  weight_kg: number | null;
  measurements: {
    chest_cm: number | null;
    waist_cm: number | null;
    bicep_avg_cm: number | null;
    thigh_avg_cm: number | null;
  };
  strength: {
    exercise_name: string;
    weight_kg: number;
    estimated_1rm: number;
  }[];
  volume_stats: {
    total_volume_kg: number;
    workout_count: number;
  };
}

export default function ComparisonTool() {
  const [fromDate, setFromDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fromData, setFromData] = useState<ComparisonData | null>(null);
  const [toData, setToData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      // Fetch data for both dates
      const [fromResponse, toResponse] = await Promise.all([
        fetch(`/api/analytics/comparison?date=${fromDate}`),
        fetch(`/api/analytics/comparison?date=${toDate}`),
      ]);

      if (fromResponse.ok && toResponse.ok) {
        const from = await fromResponse.json();
        const to = await toResponse.json();
        setFromData(from);
        setToData(to);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDifference = (from: number | null, to: number | null): string => {
    if (from === null || to === null) return 'N/A';
    const diff = to - from;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}`;
  };

  const calculatePercentage = (from: number | null, to: number | null): string => {
    if (from === null || to === null || from === 0) return 'N/A';
    const percentage = ((to - from) / from) * 100;
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Compare Progress</h2>
        <p className="text-muted-foreground">
          Compare your stats, photos, and strength between any two dates
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-card border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 rounded-lg border bg-background"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setFromDate(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
              setToDate(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80"
          >
            1 Month
          </button>
          <button
            onClick={() => {
              setFromDate(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
              setToDate(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80"
          >
            3 Months
          </button>
          <button
            onClick={() => {
              setFromDate(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
              setToDate(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="px-3 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80"
          >
            6 Months
          </button>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Compare'}
        </button>
      </div>

      {/* Comparison Results */}
      {fromData && toData && (
        <div className="space-y-6">
          {/* Body Weight Comparison */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Body Weight
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {format(new Date(fromDate), 'MMM d, yyyy')}
                </p>
                <p className="text-2xl font-bold">
                  {fromData.weight_kg ? `${fromData.weight_kg}kg` : 'N/A'}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Change</p>
                  <p className="text-xl font-bold">
                    {calculateDifference(fromData.weight_kg, toData.weight_kg)}kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calculatePercentage(fromData.weight_kg, toData.weight_kg)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {format(new Date(toDate), 'MMM d, yyyy')}
                </p>
                <p className="text-2xl font-bold">
                  {toData.weight_kg ? `${toData.weight_kg}kg` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Body Measurements</h3>
            <div className="space-y-4">
              {['chest_cm', 'waist_cm', 'bicep_avg_cm', 'thigh_avg_cm'].map((key) => {
                const label = key.replace('_cm', '').replace('_avg', '').replace('_', ' ');
                const fromValue = fromData.measurements[key as keyof typeof fromData.measurements];
                const toValue = toData.measurements[key as keyof typeof toData.measurements];

                return (
                  <div key={key} className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize mb-1">{label}</p>
                      <p className="font-semibold">{fromValue ? `${fromValue}cm` : 'N/A'}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-primary">
                        {calculateDifference(fromValue, toValue)}cm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{toValue ? `${toValue}cm` : 'N/A'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strength Comparison */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strength Progress
            </h3>
            <div className="space-y-3">
              {fromData.strength.map((fromExercise, idx) => {
                const toExercise = toData.strength.find(
                  (e) => e.exercise_name === fromExercise.exercise_name
                );

                if (!toExercise) return null;

                return (
                  <div key={idx} className="grid grid-cols-3 gap-4 items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{fromExercise.exercise_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {fromExercise.weight_kg}kg (1RM: {Math.round(fromExercise.estimated_1rm)}kg)
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-500">
                        +{calculateDifference(fromExercise.estimated_1rm, toExercise.estimated_1rm)}kg
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {calculatePercentage(fromExercise.estimated_1rm, toExercise.estimated_1rm)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {toExercise.weight_kg}kg (1RM: {Math.round(toExercise.estimated_1rm)}kg)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Comparison */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Training Volume
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                <p className="text-2xl font-bold">
                  {fromData.volume_stats.total_volume_kg.toLocaleString()}kg
                </p>
                <p className="text-sm text-muted-foreground">
                  {fromData.volume_stats.workout_count} workouts
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">
                    {calculateDifference(
                      fromData.volume_stats.total_volume_kg,
                      toData.volume_stats.total_volume_kg
                    )}
                    kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calculatePercentage(
                      fromData.volume_stats.total_volume_kg,
                      toData.volume_stats.total_volume_kg
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                <p className="text-2xl font-bold">
                  {toData.volume_stats.total_volume_kg.toLocaleString()}kg
                </p>
                <p className="text-sm text-muted-foreground">
                  {toData.volume_stats.workout_count} workouts
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!fromData && !toData && !loading && (
        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Dates to Compare</h3>
            <p className="text-muted-foreground">
              Choose two dates and click Compare to see your progress
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
