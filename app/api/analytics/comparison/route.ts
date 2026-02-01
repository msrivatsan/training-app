/**
 * Comparison API
 *
 * Returns snapshot data for a specific date for before/after comparisons
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { estimate1RM } from '@/lib/progression';
import { startOfDay, endOfDay, subDays } from 'date-fns';

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
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
  }

  try {
    const targetDate = new Date(dateParam);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Get body measurement closest to this date
    const { data: measurements } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .lte('date', dayEnd.toISOString())
      .order('date', { ascending: false })
      .limit(1);

    const measurement = measurements?.[0] || null;

    // Get strength data from a 7-day window around this date
    const windowStart = subDays(targetDate, 3);
    const windowEnd = subDays(targetDate, -3);

    const { data: sets } = await supabase
      .from('sets')
      .select(`
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
            is_priority
          )
        ),
        workout_sessions!inner (
          id,
          user_id,
          status,
          started_at
        )
      `)
      .eq('workout_sessions.user_id', user.id)
      .eq('workout_sessions.status', 'completed')
      .eq('is_warmup', false)
      .eq('exercises.exercise_library.is_priority', true)
      .gte('workout_sessions.started_at', windowStart.toISOString())
      .lte('workout_sessions.started_at', windowEnd.toISOString());

    // Get best lifts for priority exercises
    const exerciseMap: Record<string, any> = {};
    sets?.forEach((set: any) => {
      const exerciseName = set.exercises.exercise_library.name;
      const estimated1RM = estimate1RM(set.weight_kg, set.reps);

      if (!exerciseMap[exerciseName] || estimated1RM > exerciseMap[exerciseName].estimated_1rm) {
        exerciseMap[exerciseName] = {
          exercise_name: exerciseName,
          weight_kg: set.weight_kg,
          estimated_1rm: estimated1RM,
        };
      }
    });

    // Get volume stats for the week containing this date
    const weekStart = subDays(targetDate, 3);
    const weekEnd = subDays(targetDate, -3);

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('total_volume_kg')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString());

    const totalVolume = sessions?.reduce((sum: number, s: any) => sum + (s.total_volume_kg || 0), 0) || 0;

    return NextResponse.json({
      date: dateParam,
      weight_kg: measurement?.weight_kg || null,
      measurements: {
        chest_cm: measurement?.chest_cm || null,
        waist_cm: measurement?.waist_cm || null,
        bicep_avg_cm:
          measurement?.bicep_left_cm && measurement?.bicep_right_cm
            ? (measurement.bicep_left_cm + measurement.bicep_right_cm) / 2
            : null,
        thigh_avg_cm:
          measurement?.thigh_left_cm && measurement?.thigh_right_cm
            ? (measurement.thigh_left_cm + measurement.thigh_right_cm) / 2
            : null,
      },
      strength: Object.values(exerciseMap),
      volume_stats: {
        total_volume_kg: Math.round(totalVolume),
        workout_count: sessions?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error in comparison API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
