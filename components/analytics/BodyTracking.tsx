'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Scale, Camera, Ruler, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface BodyMeasurement {
  id: string;
  date: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  bicep_left_cm: number | null;
  bicep_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  notes: string | null;
}

export default function BodyTracking() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    weight_kg: '',
    chest_cm: '',
    waist_cm: '',
    bicep_left_cm: '',
    bicep_right_cm: '',
    thigh_left_cm: '',
    thigh_right_cm: '',
  });

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/body-measurements');
      if (response.ok) {
        const data = await response.json();
        setMeasurements(data.measurements || []);
      }
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/body-measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          weight_kg: newMeasurement.weight_kg ? parseFloat(newMeasurement.weight_kg) : null,
          chest_cm: newMeasurement.chest_cm ? parseFloat(newMeasurement.chest_cm) : null,
          waist_cm: newMeasurement.waist_cm ? parseFloat(newMeasurement.waist_cm) : null,
          bicep_left_cm: newMeasurement.bicep_left_cm ? parseFloat(newMeasurement.bicep_left_cm) : null,
          bicep_right_cm: newMeasurement.bicep_right_cm ? parseFloat(newMeasurement.bicep_right_cm) : null,
          thigh_left_cm: newMeasurement.thigh_left_cm ? parseFloat(newMeasurement.thigh_left_cm) : null,
          thigh_right_cm: newMeasurement.thigh_right_cm ? parseFloat(newMeasurement.thigh_right_cm) : null,
        }),
      });

      if (response.ok) {
        await fetchMeasurements();
        setShowAddForm(false);
        setNewMeasurement({
          weight_kg: '',
          chest_cm: '',
          waist_cm: '',
          bicep_left_cm: '',
          bicep_right_cm: '',
          thigh_left_cm: '',
          thigh_right_cm: '',
        });
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
    }
  };

  // Calculate 7-day moving average for weight
  const calculateMovingAverage = (data: BodyMeasurement[], days: number = 7) => {
    return data.map((item, index, arr) => {
      const start = Math.max(0, index - days + 1);
      const subset = arr.slice(start, index + 1).filter(m => m.weight_kg !== null);
      const avg = subset.reduce((sum, m) => sum + (m.weight_kg || 0), 0) / (subset.length || 1);
      return {
        date: format(new Date(item.date), 'MMM d'),
        weight: item.weight_kg,
        movingAvg: Math.round(avg * 10) / 10,
      };
    });
  };

  const weightData = measurements
    .filter(m => m.weight_kg !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = calculateMovingAverage(weightData);

  // Calculate trends
  const latestWeight = weightData[weightData.length - 1]?.weight_kg;
  const weekAgoWeight = weightData.find(m =>
    new Date(m.date) >= subDays(new Date(), 7)
  )?.weight_kg;

  const weekTrend = latestWeight && weekAgoWeight ? latestWeight - weekAgoWeight : null;

  // Latest measurements
  const latest = measurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading body tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Body Composition Tracking</h2>
          <p className="text-muted-foreground">Monitor your weight and body measurements</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Measurement
        </button>
      </div>

      {/* Add Measurement Form */}
      {showAddForm && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4">New Measurement</h3>
          <form onSubmit={handleAddMeasurement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.weight_kg}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, weight_kg: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="70.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chest (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.chest_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, chest_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Waist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.waist_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, waist_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bicep (Left, cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.bicep_left_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, bicep_left_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bicep (Right, cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.bicep_right_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, bicep_right_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thigh (Left, cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.thigh_left_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, thigh_left_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="55"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thigh (Right, cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newMeasurement.thigh_right_cm}
                  onChange={(e) => setNewMeasurement({ ...newMeasurement, thigh_right_cm: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background"
                  placeholder="55"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Save Measurement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Stats */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Current Weight</p>
            </div>
            <p className="text-2xl font-bold">{latest.weight_kg ? `${latest.weight_kg}kg` : 'N/A'}</p>
            {weekTrend !== null && (
              <p className={`text-sm flex items-center gap-1 mt-1 ${weekTrend > 0 ? 'text-orange-500' : weekTrend < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                {weekTrend > 0 ? <TrendingUp className="h-3 w-3" /> : weekTrend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                {weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(1)}kg this week
              </p>
            )}
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chest</p>
            </div>
            <p className="text-2xl font-bold">{latest.chest_cm ? `${latest.chest_cm}cm` : 'N/A'}</p>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Waist</p>
            </div>
            <p className="text-2xl font-bold">{latest.waist_cm ? `${latest.waist_cm}cm` : 'N/A'}</p>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Biceps (Avg)</p>
            </div>
            <p className="text-2xl font-bold">
              {latest.bicep_left_cm && latest.bicep_right_cm
                ? `${((latest.bicep_left_cm + latest.bicep_right_cm) / 2).toFixed(1)}cm`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Weight Progression (with 7-day Moving Average)</h3>
          <ResponsiveContainer width="100%" height={300}>
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
                domain={['dataMin - 2', 'dataMax + 2']}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--muted-foreground))', r: 3 }}
                name="Daily Weight"
              />
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
                name="7-Day Average"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Photo Upload Section */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Progress Photos</h3>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted">
            <Camera className="h-4 w-4" />
            Upload Photos
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Front</p>
            </div>
          </div>
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Side</p>
            </div>
          </div>
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center">
              <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Back</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Take weekly progress photos in consistent lighting and poses for best comparison
        </p>
      </div>

      {measurements.length === 0 && !showAddForm && (
        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Measurements Yet</h3>
            <p className="text-muted-foreground mb-4">Start tracking your body composition</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Add First Measurement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
