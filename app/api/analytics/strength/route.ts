/**
 * Strength Analytics API
 *
 * Returns strength progression data for priority lifts
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { estimate1RM } from '@/lib/progression';

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
  const exerciseId = searchParams.get('exerciseId');

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    // Build query
    let query = supabase
      .from('sets')
      .select(`
        id,
        weight_kg,
        reps,
        created_at,
        is_warmup,
        exercise_id,
        session_id,
        exercises!inner (
          id,
          name,
          exercise_library_id,
          exercise_library!inner (
            id,
            name,
            is_priority
          )
        ),
        workout_sessions!inner (
          id,
          user_id,
          started_at,
          status
        )
      `)
      .eq('workout_sessions.user_id', user.id)
      .eq('workout_sessions.status', 'completed')
      .eq('is_warmup', false)
      .gte('workout_sessions.started_at', startDate.toISOString())
      .lte('workout_sessions.started_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    // Filter by specific exercise if provided
    if (exerciseId) {
      query = query.eq('exercises.exercise_library_id', exerciseId);
    } else {
      // Only get priority lifts
      query = query.eq('exercises.exercise_library.is_priority', true);
    }

    const { data: sets, error } = await query;

    if (error) {
      console.error('Error fetching strength data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by exercise
    const exerciseData: Record<string, any> = {};
    const personalRecords: Record<string, any> = {};

    sets?.forEach((set: any) => {
      const exerciseLibId = set.exercises.exercise_library_id;
      const exerciseName = set.exercises.exercise_library.name;
      const estimated1RM = estimate1RM(set.weight_kg, set.reps);

      if (!exerciseData[exerciseLibId]) {
        exerciseData[exerciseLibId] = {
          exercise_id: exerciseLibId,
          exercise_name: exerciseName,
          data_points: [],
        };
        personalRecords[exerciseLibId] = {
          exercise_id: exerciseLibId,
          exercise_name: exerciseName,
          weight_kg: 0,
          reps: 0,
          estimated_1rm: 0,
          date: null,
        };
      }

      // Track PR
      if (estimated1RM > personalRecords[exerciseLibId].estimated_1rm) {
        personalRecords[exerciseLibId] = {
          exercise_id: exerciseLibId,
          exercise_name: exerciseName,
          weight_kg: set.weight_kg,
          reps: set.reps,
          estimated_1rm: estimated1RM,
          date: set.created_at,
        };
      }

      // Add data point
      exerciseData[exerciseLibId].data_points.push({
        date: set.created_at,
        weight_kg: set.weight_kg,
        reps: set.reps,
        volume_kg: set.weight_kg * set.reps,
        estimated_1rm: estimated1RM,
        session_id: set.session_id,
      });
    });

    // Get deload weeks for shading
    const { data: deloadWeeks } = await supabase
      .from('deload_schedule')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_week_start', startDate.toISOString())
      .lte('scheduled_week_end', endDate.toISOString());

    return NextResponse.json({
      exercises: Object.values(exerciseData),
      personal_records: Object.values(personalRecords),
      deload_weeks: deloadWeeks || [],
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        weeks,
      },
    });
  } catch (error) {
    console.error('Error in strength analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
