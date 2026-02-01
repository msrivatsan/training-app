'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Star, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DataPoint {
  date: string;
  weight_kg: number;
  reps: number;
  volume_kg: number;
  estimated_1rm: number;
  session_id: string;
}

interface ExerciseData {
  exercise_id: string;
  exercise_name: string;
  data_points: DataPoint[];
}

interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  date: string;
}

interface DeloadWeek {
  scheduled_week_start: string;
  scheduled_week_end: string;
}

interface StrengthData {
  exercises: ExerciseData[];
  personal_records: PersonalRecord[];
  deload_weeks: DeloadWeek[];
  date_range: {
    start: string;
    end: string;
    weeks: number;
  };
}

type MetricType = 'weight' | '1rm' | 'volume';

export default function StrengthGraphs() {
  const [data, setData] = useState<StrengthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricType>('1rm');
  const [weeks, setWeeks] = useState(12);

  useEffect(() => {
    fetchData();
  }, [weeks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/strength?weeks=${weeks}`);
      const result = await response.json();
      setData(result);
      if (result.exercises.length > 0 && !selectedExercise) {
        setSelectedExercise(result.exercises[0].exercise_id);
      }
    } catch (error) {
      console.error('Error fetching strength data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading strength data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.exercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Strength Data</h3>
          <p className="text-muted-foreground">
            Complete workouts to track your strength progression
          </p>
        </div>
      </div>
    );
  }

  const currentExercise = data.exercises.find(e => e.exercise_id === selectedExercise);
  const currentPR = data.personal_records.find(pr => pr.exercise_id === selectedExercise);

  // Prepare chart data
  const chartData = currentExercise?.data_points.map(dp => ({
    date: format(new Date(dp.date), 'MMM d'),
    fullDate: dp.date,
    weight: dp.weight_kg,
    volume: dp.volume_kg,
    estimated1RM: Math.round(dp.estimated_1rm * 10) / 10,
    reps: dp.reps,
  })) || [];

  // Get metric value for chart
  const getMetricValue = (metric: MetricType) => {
    switch (metric) {
      case 'weight':
        return 'weight';
      case '1rm':
        return 'estimated1RM';
      case 'volume':
        return 'volume';
    }
  };

  const metricKey = getMetricValue(metric);
  const metricLabel = metric === '1rm' ? 'Estimated 1RM (kg)' : metric === 'weight' ? 'Weight (kg)' : 'Volume (kg)';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {data.exercises.map(exercise => (
            <button
              key={exercise.exercise_id}
              onClick={() => setSelectedExercise(exercise.exercise_id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedExercise === exercise.exercise_id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {exercise.exercise_name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border bg-background"
          >
            <option value={4}>4 weeks</option>
            <option value={8}>8 weeks</option>
            <option value={12}>12 weeks</option>
            <option value={24}>24 weeks</option>
          </select>
        </div>
      </div>

      {/* Personal Record Card */}
      {currentPR && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <div>
              <h3 className="font-semibold">Personal Record</h3>
              <p className="text-sm text-muted-foreground">
                {currentPR.weight_kg}kg × {currentPR.reps} reps (Estimated 1RM: {Math.round(currentPR.estimated_1rm)}kg)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Set on {format(new Date(currentPR.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMetric('weight')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            metric === 'weight'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Weight
        </button>
        <button
          onClick={() => setMetric('1rm')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            metric === '1rm'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Estimated 1RM
        </button>
        <button
          onClick={() => setMetric('volume')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            metric === 'volume'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Volume
        </button>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">
          {currentExercise?.exercise_name} - {metricLabel}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: metricLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === metricKey) {
                  return [`${value}kg`, metricLabel];
                }
                return [value, name];
              }}
            />
            <Legend />

            {/* Deload weeks as shaded regions */}
            {data.deload_weeks.map((deload, idx) => (
              <ReferenceLine
                key={idx}
                x={format(new Date(deload.scheduled_week_start), 'MMM d')}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{ value: 'Deload', position: 'top', fontSize: 10 }}
              />
            ))}

            {/* Main line */}
            <Line
              type="monotone"
              dataKey={metricKey}
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
              name={metricLabel}
            />

            {/* Mark PRs with stars */}
            {chartData.map((point, idx) => {
              const isPR = currentPR && point.fullDate === currentPR.date;
              if (isPR && metric === '1rm') {
                return (
                  <ReferenceLine
                    key={`pr-${idx}`}
                    x={point.date}
                    stroke="gold"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{currentExercise?.data_points.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current PR</p>
            <p className="text-2xl font-bold">{currentPR ? `${Math.round(currentPR.estimated_1rm)}kg` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max Weight</p>
            <p className="text-2xl font-bold">
              {currentExercise ? `${Math.max(...currentExercise.data_points.map(dp => dp.weight_kg))}kg` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold">
              {currentExercise ? `${Math.round(currentExercise.data_points.reduce((sum, dp) => sum + dp.volume_kg, 0))}kg` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
