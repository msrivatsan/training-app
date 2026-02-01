import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Set } from '@/lib/types';
import { generateStrengthCurve, projectStrengthCurve } from '@/lib/performance-predictor';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const exerciseId = searchParams.get('exerciseId');
  const includeProjection = searchParams.get('projection') === 'true';

  if (!userId || !exerciseId) {
    return NextResponse.json(
      { error: 'User ID and Exercise ID are required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Get all sets for this exercise
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select(`
        id,
        weight_kg,
        reps,
        created_at,
        is_warmup,
        session_id,
        exercise:exercises!inner (
          exercise_library_id,
          workout_sessions!inner (
            user_id,
            completed_at
          )
        )
      `)
      .eq('exercise.exercise_library_id', exerciseId)
      .eq('exercise.workout_sessions.user_id', userId)
      .eq('is_warmup', false)
      .not('exercise.workout_sessions.completed_at', 'is', null)
      .order('created_at', { ascending: true });

    if (setsError) throw setsError;

    if (!sets || sets.length === 0) {
      return NextResponse.json({ curve: [], projection: [] });
    }

    // Generate strength curve
    const typedSets = sets as unknown as Array<Set & { created_at: string }>;
    const curve = generateStrengthCurve(typedSets);

    // Generate projection if requested
    let projection = [];
    if (includeProjection && curve.length >= 2) {
      projection = projectStrengthCurve(curve, 12);
    }

    return NextResponse.json({ curve, projection });
  } catch (error) {
    console.error('Error generating strength curve:', error);
    return NextResponse.json(
      { error: 'Failed to generate strength curve' },
      { status: 500 }
    );
  }
}
