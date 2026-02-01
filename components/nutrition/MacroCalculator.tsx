'use client';

/**
 * Macro Calculator Component
 *
 * Calculates recommended macros based on user stats and goals
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MacroCalculatorResult } from '@/lib/types';
import { Calculator, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface MacroCalculatorProps {
  onCalculate?: (result: MacroCalculatorResult) => void;
  initialValues?: {
    weight_kg?: number;
    height_cm?: number;
    age?: number;
    gender?: 'male' | 'female' | 'other';
  };
}

export default function MacroCalculator({ onCalculate, initialValues }: MacroCalculatorProps) {
  const [weight, setWeight] = useState(initialValues?.weight_kg?.toString() || '');
  const [height, setHeight] = useState(initialValues?.height_cm?.toString() || '');
  const [age, setAge] = useState(initialValues?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    initialValues?.gender || 'male'
  );
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  >('moderate');
  const [goalType, setGoalType] = useState<'cut' | 'maintain' | 'bulk'>('maintain');
  const [result, setResult] = useState<MacroCalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!weight || !height || !age) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/nutrition/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_weight_kg: parseFloat(weight),
          height_cm: parseInt(height),
          age: parseInt(age),
          gender,
          activity_level: activityLevel,
          goal_type: goalType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate macros');
      }

      const data = await response.json();
      setResult(data.macros);

      if (onCalculate) {
        onCalculate(data.macros);
      }
    } catch (error) {
      console.error('Error calculating macros:', error);
      alert('Failed to calculate macros. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {/* Goal Type */}
        <div>
          <Label htmlFor="goal-type">Goal</Label>
          <Select value={goalType} onValueChange={(v: any) => setGoalType(v)}>
            <SelectTrigger id="goal-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cut">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Cut (Lose Fat)
                </div>
              </SelectItem>
              <SelectItem value="maintain">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  Maintain Weight
                </div>
              </SelectItem>
              <SelectItem value="bulk">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Bulk (Build Muscle)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weight */}
        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        {/* Height */}
        <div>
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>

        {/* Age */}
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="25"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        {/* Gender */}
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={(v: any) => setGender(v)}>
            <SelectTrigger id="gender">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Level */}
        <div>
          <Label htmlFor="activity">Activity Level</Label>
          <Select value={activityLevel} onValueChange={(v: any) => setActivityLevel(v)}>
            <SelectTrigger id="activity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little exercise)</SelectItem>
              <SelectItem value="light">Light (1-3 days/week)</SelectItem>
              <SelectItem value="moderate">Moderate (4-5 days/week)</SelectItem>
              <SelectItem value="active">Active (daily exercise)</SelectItem>
              <SelectItem value="very_active">Very Active (intense daily)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCalculate} disabled={loading} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          {loading ? 'Calculating...' : 'Calculate Macros'}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold">Your Recommended Macros</h3>

          <div className="grid gap-4">
            {/* BMR & TDEE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">BMR</p>
                <p className="text-2xl font-bold">{result.bmr}</p>
                <p className="text-xs text-muted-foreground">cal/day at rest</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">TDEE</p>
                <p className="text-2xl font-bold">{result.tdee}</p>
                <p className="text-xs text-muted-foreground">total daily burn</p>
              </div>
            </div>

            {/* Daily Target */}
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm font-medium">Daily Calorie Target</p>
              <p className="text-3xl font-bold">{result.daily_calories}</p>
              <p className="text-xs text-muted-foreground">
                {goalType === 'cut' && '-400 cal deficit'}
                {goalType === 'bulk' && '+400 cal surplus'}
                {goalType === 'maintain' && 'maintenance'}
              </p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-2xl font-bold text-red-500">{result.daily_protein_g}g</p>
                <p className="text-xs text-muted-foreground">
                  {result.protein_per_kg}g/kg
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-2xl font-bold text-blue-500">{result.daily_carbs_g}g</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Fats</p>
                <p className="text-2xl font-bold text-yellow-500">{result.daily_fats_g}g</p>
              </div>
            </div>

            {/* Water */}
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Daily Water Target</p>
              <p className="text-2xl font-bold">{result.daily_water_ml} ml</p>
              <p className="text-xs text-muted-foreground">
                ≈ {Math.round(result.daily_water_ml / 250)} glasses
              </p>
            </div>

            {/* Explanation */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm leading-relaxed">{result.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
