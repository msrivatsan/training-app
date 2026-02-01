import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Set } from '@/lib/types';
import { predict1RM, calculatePredictionConfidence, generateStrengthCurve } from '@/lib/performance-predictor';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const exerciseId = searchParams.get('exerciseId');

  if (!userId || !exerciseId) {
    return NextResponse.json(
      { error: 'User ID and Exercise ID are required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Get recent sets for this exercise (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    if (setsError) throw setsError;

    if (!sets || sets.length === 0) {
      return NextResponse.json({ predicted_1rm: null, confidence: 0 });
    }

    // Generate strength curve
    const typedSets = sets as unknown as Array<Set & { created_at: string }>;
    const strengthCurve = generateStrengthCurve(typedSets);

    if (strengthCurve.length === 0) {
      return NextResponse.json({ predicted_1rm: null, confidence: 0 });
    }

    // Get the latest prediction
    const latestPoint = strengthCurve[strengthCurve.length - 1];
    const predicted1RM = latestPoint.estimated_1rm_kg;

    // Calculate confidence
    const avgReps = typedSets.reduce((sum, s) => sum + s.reps, 0) / typedSets.length;
    const daysSinceLastSession = Math.floor(
      (Date.now() - new Date(sets[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const confidence = calculatePredictionConfidence({
      sessionsCount: strengthCurve.length,
      averageReps: avgReps,
      daysSinceLastSession,
    });

    // Store prediction in database
    await supabase.from('performance_predictions').insert({
      user_id: userId,
      exercise_library_id: exerciseId,
      predicted_1rm_kg: predicted1RM,
      confidence_score: confidence,
      based_on_sessions: strengthCurve.length,
      prediction_method: 'weighted_average',
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return NextResponse.json({ predicted_1rm: predicted1RM, confidence });
  } catch (error) {
    console.error('Error predicting 1RM:', error);
    return NextResponse.json({ error: 'Failed to predict 1RM' }, { status: 500 });
  }
}
