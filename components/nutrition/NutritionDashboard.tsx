'use client';

/**
 * Nutrition Dashboard Component
 *
 * Main dashboard showing daily macro targets and progress with quick-add meal buttons
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DailyNutritionSummary, NutritionGoal, MacroProgress } from '@/lib/types';
import {
  Coffee,
  Sun,
  Moon,
  Cookie,
  Dumbbell,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface NutritionDashboardProps {
  userId: string;
  onAddMeal?: (mealType: string) => void;
}

export default function NutritionDashboard({ userId, onAddMeal }: NutritionDashboardProps) {
  const [summary, setSummary] = useState<DailyNutritionSummary | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [macroProgress, setMacroProgress] = useState<MacroProgress | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch active goal
      const goalsResponse = await fetch('/api/nutrition/goals');
      const goalsData = await goalsResponse.json();
      setGoal(goalsData.active_goal);

      // Fetch today's meals
      const today = format(new Date(), 'yyyy-MM-dd');
      const mealsResponse = await fetch(`/api/nutrition/meals?date=${today}`);
      const mealsData = await mealsResponse.json();

      // Calculate totals from meals
      const totals = mealsData.meals.reduce(
        (acc: any, meal: any) => ({
          calories: acc.calories + meal.total_calories,
          protein: acc.protein + meal.total_protein,
          carbs: acc.carbs + meal.total_carbs,
          fats: acc.fats + meal.total_fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      // Calculate progress
      if (goalsData.active_goal) {
        setMacroProgress({
          protein: {
            current: totals.protein,
            target: goalsData.active_goal.daily_protein_g,
            percentage: Math.round(
              (totals.protein / goalsData.active_goal.daily_protein_g) * 100
            ),
            remaining: Math.max(0, goalsData.active_goal.daily_protein_g - totals.protein),
          },
          carbs: {
            current: totals.carbs,
            target: goalsData.active_goal.daily_carbs_g,
            percentage: Math.round(
              (totals.carbs / goalsData.active_goal.daily_carbs_g) * 100
            ),
            remaining: Math.max(0, goalsData.active_goal.daily_carbs_g - totals.carbs),
          },
          fats: {
            current: totals.fats,
            target: goalsData.active_goal.daily_fats_g,
            percentage: Math.round(
              (totals.fats / goalsData.active_goal.daily_fats_g) * 100
            ),
            remaining: Math.max(0, goalsData.active_goal.daily_fats_g - totals.fats),
          },
          calories: {
            current: totals.calories,
            target: goalsData.active_goal.daily_calories,
            percentage: Math.round(
              (totals.calories / goalsData.active_goal.daily_calories) * 100
            ),
            remaining: Math.max(0, goalsData.active_goal.daily_calories - totals.calories),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading nutrition data...</div>;
  }

  if (!goal) {
    return (
      <div className="text-center py-8 space-y-4">
        <Target className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Nutrition Goal Set</h3>
        <p className="text-muted-foreground">
          Set up your nutrition goals to start tracking your macros.
        </p>
        <Button onClick={() => window.location.href = '/profile'}>
          Set Up Goals
        </Button>
      </div>
    );
  }

  const mealTypes = [
    { type: 'breakfast', label: 'Breakfast', icon: Coffee },
    { type: 'lunch', label: 'Lunch', icon: Sun },
    { type: 'dinner', label: 'Dinner', icon: Moon },
    { type: 'snack', label: 'Snack', icon: Cookie },
    { type: 'pre_workout', label: 'Pre-Workout', icon: Dumbbell },
    { type: 'post_workout', label: 'Post-Workout', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Daily Calories */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Daily Calories</h3>
          <span className="text-2xl font-bold">
            {macroProgress?.calories.current || 0} / {goal.daily_calories}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${Math.min(macroProgress?.calories.percentage || 0, 100)}%`,
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {macroProgress?.calories.remaining || 0} calories remaining
        </p>
      </div>

      {/* Macro Progress Rings */}
      <div className="grid grid-cols-3 gap-4">
        {/* Protein */}
        <div className="rounded-lg border bg-card p-4">
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="transform -rotate-90" width="96" height="96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${
                  2 * Math.PI * 40 * (1 - (macroProgress?.protein.percentage || 0) / 100)
                }`}
                className="text-red-500 transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{macroProgress?.protein.percentage || 0}%</span>
            </div>
          </div>
          <p className="text-center font-medium">Protein</p>
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(macroProgress?.protein.current || 0)}g / {goal.daily_protein_g}g
          </p>
        </div>

        {/* Carbs */}
        <div className="rounded-lg border bg-card p-4">
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="transform -rotate-90" width="96" height="96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${
                  2 * Math.PI * 40 * (1 - (macroProgress?.carbs.percentage || 0) / 100)
                }`}
                className="text-blue-500 transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{macroProgress?.carbs.percentage || 0}%</span>
            </div>
          </div>
          <p className="text-center font-medium">Carbs</p>
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(macroProgress?.carbs.current || 0)}g / {goal.daily_carbs_g}g
          </p>
        </div>

        {/* Fats */}
        <div className="rounded-lg border bg-card p-4">
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="transform -rotate-90" width="96" height="96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${
                  2 * Math.PI * 40 * (1 - (macroProgress?.fats.percentage || 0) / 100)
                }`}
                className="text-yellow-500 transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{macroProgress?.fats.percentage || 0}%</span>
            </div>
          </div>
          <p className="text-center font-medium">Fats</p>
          <p className="text-center text-sm text-muted-foreground">
            {Math.round(macroProgress?.fats.current || 0)}g / {goal.daily_fats_g}g
          </p>
        </div>
      </div>

      {/* Quick Add Meal Buttons */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Add Meal</h3>
        <div className="grid grid-cols-2 gap-3">
          {mealTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant="outline"
              className="justify-start"
              onClick={() => onAddMeal?.(type)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Goal Info */}
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Current Goal</p>
          <span className="text-xs px-2 py-1 rounded-full bg-background capitalize">
            {goal.goal_type}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Activity Level: <span className="capitalize">{goal.activity_level.replace('_', ' ')}</span>
        </p>
      </div>
    </div>
  );
}
