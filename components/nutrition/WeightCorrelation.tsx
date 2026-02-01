'use client';

/**
 * Weight Correlation Component
 *
 * Shows correlation between weight changes and calorie intake with recommendations
 */

import { useEffect, useState } from 'react';
import type { WeightTrendAnalysis } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function WeightCorrelation() {
  const [analysis, setAnalysis] = useState<WeightTrendAnalysis | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/nutrition/analytics?type=weight_correlation&days=30');
      const data = await response.json();

      setAnalysis({
        current_trend: data.current_trend,
        weekly_change_kg: data.weekly_change_kg,
        average_daily_calories: data.average_daily_calories,
        goal_alignment: data.goal_alignment,
        suggested_adjustment: data.suggested_adjustment,
        message: data.message,
      });

      // Transform data for dual-axis chart
      setChartData(data.data_points.map((p: any) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: p.weight_kg,
        calories: p.calories,
      })));
    } catch (error) {
      console.error('Error fetching weight correlation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analysis...</div>;
  }

  if (!analysis || chartData.length < 7) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Not Enough Data</h3>
        <p className="text-sm text-muted-foreground">
          Log your weight in body measurements and track your nutrition for at least 7 days
          to see weight correlation insights.
        </p>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (analysis.current_trend === 'gaining') return TrendingUp;
    if (analysis.current_trend === 'losing') return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (analysis.current_trend === 'gaining') return 'text-green-500';
    if (analysis.current_trend === 'losing') return 'text-red-500';
    return 'text-gray-500';
  };

  const getAlignmentStatus = () => {
    if (analysis.goal_alignment === 'on_track') {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950',
        label: 'On Track',
      };
    } else if (analysis.goal_alignment === 'too_fast') {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        label: 'Too Fast',
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        label: 'Too Slow',
      };
    }
  };

  const TrendIcon = getTrendIcon();
  const alignmentStatus = getAlignmentStatus();
  const AlignmentIcon = alignmentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Weight Trend Analysis</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendIcon className={`h-5 w-5 ${getTrendColor()}`} />
              <p className="text-sm text-muted-foreground">Trend</p>
            </div>
            <p className="text-2xl font-bold capitalize">
              {analysis.current_trend.replace('_', ' ')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {analysis.weekly_change_kg >= 0 ? '+' : ''}
              {analysis.weekly_change_kg.toFixed(1)}kg per week
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlignmentIcon className={`h-5 w-5 ${alignmentStatus.color}`} />
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
            <p className="text-2xl font-bold">{alignmentStatus.label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {analysis.average_daily_calories} cal/day avg
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className={`rounded-lg p-4 ${alignmentStatus.bgColor}`}>
        <h4 className="font-semibold mb-2">Analysis</h4>
        <p className="text-sm mb-3">{analysis.message}</p>

        {analysis.suggested_adjustment !== 0 && (
          <div className="rounded-lg bg-background/50 p-3">
            <p className="text-sm font-medium mb-1">Recommended Adjustment</p>
            <p className="text-2xl font-bold">
              {analysis.suggested_adjustment > 0 ? '+' : ''}
              {analysis.suggested_adjustment} calories
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              New target: {analysis.average_daily_calories + analysis.suggested_adjustment} cal/day
            </p>
          </div>
        )}
      </div>

      {/* Weight & Calorie Correlation Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h4 className="font-semibold mb-4">Weight vs Calories (30 Days)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Calories', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#8884d8"
              name="Weight (kg)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="calories"
              stroke="#82ca9d"
              name="Calories"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tips */}
      <div className="rounded-lg bg-muted p-4">
        <h4 className="font-semibold mb-2">Tips</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Weigh yourself daily at the same time for consistent tracking</li>
          <li>• Weight fluctuates 1-2kg daily due to water, food, and other factors</li>
          <li>• Focus on weekly averages rather than daily changes</li>
          <li>• Adjust calories gradually (±200 cal) and monitor for 1-2 weeks</li>
        </ul>
      </div>
    </div>
  );
}
