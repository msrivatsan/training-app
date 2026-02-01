'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MuscleGroup {
  muscle_group: string;
  volume_kg: number;
  sets: number;
  percentage: number;
}

interface WeeklyVolume {
  date: string;
  volume: number;
  workouts: number;
}

interface VolumeData {
  weekly_volume: WeeklyVolume[];
  muscle_groups: MuscleGroup[];
  total_volume_kg: number;
  trend: 'increasing' | 'maintaining' | 'decreasing';
  trend_percentage: number;
  balance_warnings: string[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
];

export default function VolumeAnalytics() {
  const [data, setData] = useState<VolumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState(12);

  useEffect(() => {
    fetchData();
  }, [weeks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/volume?weeks=${weeks}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching volume data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading volume analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || data.weekly_volume.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Volume Data</h3>
          <p className="text-muted-foreground">
            Complete workouts to track your training volume
          </p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      default:
        return <Minus className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'increasing':
        return 'text-green-500';
      case 'decreasing':
        return 'text-orange-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Volume Analytics</h2>
          <p className="text-muted-foreground">Track your total training volume and muscle group distribution</p>
        </div>
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

      {/* Balance Warnings */}
      {data.balance_warnings.length > 0 && (
        <div className="bg-orange-500/10 border-2 border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-500 mb-2">Muscle Balance Warnings</h3>
              <ul className="space-y-1">
                {data.balance_warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Volume</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{data.total_volume_kg.toLocaleString()}kg</p>
          <p className="text-xs text-muted-foreground mt-1">Last {weeks} weeks</p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Volume Trend</p>
            {getTrendIcon()}
          </div>
          <p className={`text-3xl font-bold capitalize ${getTrendColor()}`}>
            {data.trend}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.trend_percentage > 0 ? '+' : ''}{data.trend_percentage.toFixed(1)}% vs previous period
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Muscle Groups</p>
          </div>
          <p className="text-3xl font-bold">{data.muscle_groups.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Trained in this period</p>
        </div>
      </div>

      {/* Weekly Volume Chart */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Volume Progression</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.weekly_volume}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'volume') return [`${value.toLocaleString()}kg`, 'Total Volume'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="volume"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
              name="Volume (kg)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Muscle Group Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Volume by Muscle Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.muscle_groups.slice(0, 10)}
                dataKey="volume_kg"
                nameKey="muscle_group"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.muscle_group}: ${entry.percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {data.muscle_groups.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()}kg`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Muscle Group Table */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {data.muscle_groups.map((mg, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="font-medium capitalize">{mg.muscle_group}</p>
                    <p className="text-xs text-muted-foreground">{mg.sets} sets</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{mg.volume_kg.toLocaleString()}kg</p>
                  <p className="text-xs text-muted-foreground">{mg.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Push vs Pull Analysis */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Push vs Pull Balance</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Push Volume</p>
            <div className="space-y-2">
              {data.muscle_groups
                .filter(mg =>
                  ['chest', 'shoulders', 'triceps', 'anterior deltoid', 'lateral deltoid'].some(m =>
                    mg.muscle_group.toLowerCase().includes(m)
                  )
                )
                .map((mg, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-sm capitalize">{mg.muscle_group}</span>
                    <span className="text-sm font-medium">{mg.volume_kg.toLocaleString()}kg</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Pull Volume</p>
            <div className="space-y-2">
              {data.muscle_groups
                .filter(mg =>
                  ['back', 'lats', 'biceps', 'traps', 'rear deltoid', 'rhomboids'].some(m =>
                    mg.muscle_group.toLowerCase().includes(m)
                  )
                )
                .map((mg, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-sm capitalize">{mg.muscle_group}</span>
                    <span className="text-sm font-medium">{mg.volume_kg.toLocaleString()}kg</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
