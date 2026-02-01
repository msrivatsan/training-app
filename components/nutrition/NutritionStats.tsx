'use client';

/**
 * Nutrition Stats Component
 *
 * Weekly nutrition statistics and compliance tracking
 */

import { useEffect, useState } from 'react';
import type { WeeklyNutritionStats, NutritionGoal } from '@/lib/types';
import { TrendingUp, Target, Award, Droplet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function NutritionStats() {
  const [stats, setStats] = useState<WeeklyNutritionStats | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch weekly stats
      const statsResponse = await fetch('/api/nutrition/analytics?type=weekly');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch daily summaries for chart
      const summariesResponse = await fetch('/api/nutrition/analytics?type=daily_summary&days=30');
      const summariesData = await summariesResponse.json();

      // Transform for chart
      const chartData = summariesData.summaries.map((s: any) => ({
        date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: s.total_calories,
        protein: s.total_protein,
        carbs: s.total_carbs,
        fats: s.total_fats,
      }));
      setDailyData(chartData);

      // Fetch active goal
      const goalsResponse = await fetch('/api/nutrition/goals');
      const goalsData = await goalsResponse.json();
      setGoal(goalsData.active_goal);
    } catch (error) {
      console.error('Error fetching nutrition stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* This Week Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-4">This Week</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">Avg Calories</p>
            </div>
            <p className="text-2xl font-bold">{stats.average_calories}</p>
            {goal && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {goal.daily_calories} cal
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Avg Protein</p>
            </div>
            <p className="text-2xl font-bold">{stats.average_protein}g</p>
            {goal && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {goal.daily_protein_g}g
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Avg Water</p>
            </div>
            <p className="text-2xl font-bold">{stats.average_water_ml}ml</p>
            {goal && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {goal.daily_water_ml}ml
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Compliance</p>
            </div>
            <p className="text-2xl font-bold">{stats.compliance_score}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.days_logged} days logged
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Details */}
      <div className="rounded-lg border bg-card p-6">
        <h4 className="font-semibold mb-4">Weekly Compliance</h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Protein Target</span>
              <span className="text-sm font-semibold">
                {stats.days_hit_protein} / {stats.days_logged} days
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${stats.days_logged > 0 ? (stats.days_hit_protein / stats.days_logged) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Calorie Target</span>
              <span className="text-sm font-semibold">
                {stats.days_hit_calories} / {stats.days_logged} days
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${stats.days_logged > 0 ? (stats.days_hit_calories / stats.days_logged) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">Water Target</span>
              <span className="text-sm font-semibold">
                {stats.days_hit_water} / {stats.days_logged} days
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${stats.days_logged > 0 ? (stats.days_hit_water / stats.days_logged) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Macro Averages */}
      <div className="rounded-lg border bg-card p-6">
        <h4 className="font-semibold mb-4">Weekly Average Macros</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Protein</p>
            <p className="text-2xl font-bold text-red-500">{stats.average_protein}g</p>
            {goal && (
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.average_protein / goal.current_weight_kg) || 0).toFixed(1)}g/kg
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Carbs</p>
            <p className="text-2xl font-bold text-blue-500">{stats.average_carbs}g</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Fats</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.average_fats}g</p>
          </div>
        </div>
      </div>

      {/* 30-Day Trend Chart */}
      {dailyData.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h4 className="font-semibold mb-4">30-Day Calorie Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke="#8884d8" name="Calories" />
              {goal && (
                <Line
                  type="monotone"
                  dataKey={() => goal.daily_calories}
                  stroke="#82ca9d"
                  name="Target"
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
