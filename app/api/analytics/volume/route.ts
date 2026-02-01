/**
 * Volume Analytics API
 *
 * Returns volume analysis by week, muscle group, and trends
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const weeks = parseInt(searchParams.get('weeks') || '12');

  try {
    const endDate = new Date();
    const startDate = subWeeks(endDate, weeks);

    // Get all completed sessions with sets and exercises
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        started_at,
        total_volume_kg,
        sets!inner (
          id,
          weight_kg,
          reps,
          is_warmup,
          exercises!inner (
            id,
            name,
            exercise_library!inner (
              id,
              name,
              primary_muscle_group,
              secondary_muscle_groups
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching volume data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Weekly volume totals
    const weeklyVolume: Record<string, { date: string; volume: number; workouts: number }> = {};

    // Muscle group volume
    const muscleGroupVolume: Record<string, { volume: number; sets: number }> = {};

    // Process each session
    sessions?.forEach((session: any) => {
      const weekStart = format(startOfWeek(new Date(session.started_at)), 'yyyy-MM-dd');

      if (!weeklyVolume[weekStart]) {
        weeklyVolume[weekStart] = { date: weekStart, volume: 0, workouts: 0 };
      }

      weeklyVolume[weekStart].volume += session.total_volume_kg || 0;
      weeklyVolume[weekStart].workouts += 1;

      // Process sets for muscle group distribution
      session.sets?.forEach((set: any) => {
        if (set.is_warmup) return;

        const volume = set.weight_kg * set.reps;
        const primaryMuscle = set.exercises.exercise_library.primary_muscle_group;
        const secondaryMuscles = set.exercises.exercise_library.secondary_muscle_groups || [];

        // Primary muscle gets full volume
        if (!muscleGroupVolume[primaryMuscle]) {
          muscleGroupVolume[primaryMuscle] = { volume: 0, sets: 0 };
        }
        muscleGroupVolume[primaryMuscle].volume += volume;
        muscleGroupVolume[primaryMuscle].sets += 1;

        // Secondary muscles get 50% volume credit
        secondaryMuscles.forEach((muscle: string) => {
          if (!muscleGroupVolume[muscle]) {
            muscleGroupVolume[muscle] = { volume: 0, sets: 0 };
          }
          muscleGroupVolume[muscle].volume += volume * 0.5;
          muscleGroupVolume[muscle].sets += 0.5;
        });
      });
    });

    // Convert to arrays and calculate percentages
    const weeklyVolumeArray = Object.values(weeklyVolume).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const totalVolume = Object.values(muscleGroupVolume).reduce(
      (sum, mg) => sum + mg.volume,
      0
    );

    const muscleGroupArray = Object.entries(muscleGroupVolume)
      .map(([muscle, data]) => ({
        muscle_group: muscle,
        volume_kg: Math.round(data.volume),
        sets: Math.round(data.sets),
        percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
      }))
      .sort((a, b) => b.volume_kg - a.volume_kg);

    // Calculate volume trends
    const recentWeeks = weeklyVolumeArray.slice(-4);
    const previousWeeks = weeklyVolumeArray.slice(-8, -4);

    const recentAvg = recentWeeks.reduce((sum, w) => sum + w.volume, 0) / (recentWeeks.length || 1);
    const previousAvg = previousWeeks.reduce((sum, w) => sum + w.volume, 0) / (previousWeeks.length || 1);

    let trend: 'increasing' | 'maintaining' | 'decreasing' = 'maintaining';
    if (recentAvg > previousAvg * 1.1) trend = 'increasing';
    else if (recentAvg < previousAvg * 0.9) trend = 'decreasing';

    // Muscle balance analysis
    const muscleBalanceWarnings: string[] = [];

    // Check push vs pull balance
    const pushMuscles = ['chest', 'shoulders', 'triceps'];
    const pullMuscles = ['back', 'lats', 'biceps', 'traps'];

    const pushVolume = muscleGroupArray
      .filter(mg => pushMuscles.some(pm => mg.muscle_group.toLowerCase().includes(pm)))
      .reduce((sum, mg) => sum + mg.volume_kg, 0);

    const pullVolume = muscleGroupArray
      .filter(mg => pullMuscles.some(pm => mg.muscle_group.toLowerCase().includes(pm)))
      .reduce((sum, mg) => sum + mg.volume_kg, 0);

    if (pushVolume > pullVolume * 1.5) {
      muscleBalanceWarnings.push('Push volume is 50% higher than pull - consider adding more back work');
    } else if (pullVolume > pushVolume * 1.5) {
      muscleBalanceWarnings.push('Pull volume is 50% higher than push - consider balancing with more pressing work');
    }

    // Check quad vs hamstring balance
    const quadVolume = muscleGroupArray.find(mg => mg.muscle_group.toLowerCase().includes('quadriceps'))?.volume_kg || 0;
    const hamstringVolume = muscleGroupArray.find(mg => mg.muscle_group.toLowerCase().includes('hamstrings'))?.volume_kg || 0;

    if (quadVolume > hamstringVolume * 2) {
      muscleBalanceWarnings.push('Quadriceps volume is significantly higher than hamstrings - add more hamstring work');
    }

    return NextResponse.json({
      weekly_volume: weeklyVolumeArray,
      muscle_groups: muscleGroupArray,
      total_volume_kg: Math.round(totalVolume),
      trend,
      trend_percentage: previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0,
      balance_warnings: muscleBalanceWarnings,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        weeks,
      },
    });
  } catch (error) {
    console.error('Error in volume analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
