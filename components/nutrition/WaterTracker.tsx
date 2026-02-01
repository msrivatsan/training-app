'use client';

/**
 * Water Tracker Component
 *
 * Simple water intake tracker with quick-add buttons
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NutritionGoal } from '@/lib/types';
import { Droplet, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface WaterTrackerProps {
  userId: string;
}

export default function WaterTracker({ userId }: WaterTrackerProps) {
  const [totalWater, setTotalWater] = useState(0);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch nutrition goal
      const goalsResponse = await fetch('/api/nutrition/goals');
      const goalsData = await goalsResponse.json();
      setGoal(goalsData.active_goal);

      // Fetch today's water logs
      const today = format(new Date(), 'yyyy-MM-dd');
      const waterResponse = await fetch(`/api/nutrition/water?date=${today}`);
      const waterData = await waterResponse.json();
      setTotalWater(waterData.total_ml || 0);
    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount_ml: number) => {
    try {
      const response = await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_ml,
          date: format(new Date(), 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log water');
      }

      setTotalWater(totalWater + amount_ml);
    } catch (error) {
      console.error('Error logging water:', error);
      alert('Failed to log water. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  const targetWater = goal?.daily_water_ml || 2500;
  const percentage = Math.min(Math.round((totalWater / targetWater) * 100), 100);
  const glassesTarget = Math.round(targetWater / 250);
  const glassesCurrent = Math.round(totalWater / 250);

  return (
    <div className="space-y-6">
      {/* Water Progress */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Water Intake</h3>
          </div>
          <span className="text-2xl font-bold">
            {totalWater} / {targetWater} ml
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{percentage}% of daily goal</span>
          <span>{glassesCurrent} / {glassesTarget} glasses</span>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div>
        <h4 className="text-sm font-medium mb-3">Quick Add</h4>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => addWater(250)}
            className="h-auto py-4"
          >
            <div className="text-center">
              <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="font-semibold">Glass</p>
              <p className="text-xs text-muted-foreground">250 ml</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => addWater(500)}
            className="h-auto py-4"
          >
            <div className="text-center">
              <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="font-semibold">Bottle</p>
              <p className="text-xs text-muted-foreground">500 ml</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => addWater(750)}
            className="h-auto py-4"
          >
            <div className="text-center">
              <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="font-semibold">Large Bottle</p>
              <p className="text-xs text-muted-foreground">750 ml</p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => addWater(1000)}
            className="h-auto py-4"
          >
            <div className="text-center">
              <Droplet className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <p className="font-semibold">Large Bottle</p>
              <p className="text-xs text-muted-foreground">1000 ml</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Hydration Tips */}
      {percentage < 50 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
          <p className="text-sm font-medium mb-1">Hydration Reminder</p>
          <p className="text-xs text-muted-foreground">
            You're at {percentage}% of your daily water goal. Stay hydrated for optimal
            performance and recovery!
          </p>
        </div>
      )}

      {percentage >= 100 && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
          <p className="text-sm font-medium mb-1">Great Job!</p>
          <p className="text-xs text-muted-foreground">
            You've hit your daily water goal. Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}
