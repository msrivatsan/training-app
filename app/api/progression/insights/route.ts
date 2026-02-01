import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProgressionInsight, Set } from '@/lib/types';
import { predict1RM, calculateMonthlyGain, generateStrengthCurve } from '@/lib/performance-predictor';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '3');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Get user's exercises with recent activity
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select(`
        id,
        exercise_library_id,
        workout_id,
        exercise_library (
          id,
          name,
          is_compound
        )
      `)
      .limit(10);

    if (exercisesError) throw exercisesError;

    const insights: ProgressionInsight[] = [];

    // For each exercise, generate insights
    for (const exercise of exercises || []) {
      if (!exercise.exercise_library) continue;

      // Get recent sets for this exercise
      const { data: sets, error: setsError } = await supabase
        .from('sets')
        .select(`
          id,
          weight_kg,
          reps,
          created_at,
          session_id,
          workout_sessions!inner (
            user_id,
            completed_at
          )
        `)
        .eq('exercise_id', exercise.id)
        .eq('workout_sessions.user_id', userId)
        .eq('is_warmup', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (setsError || !sets || sets.length < 3) continue;

      // Generate strength curve
      const typedSets = sets as unknown as Array<Set & { created_at: string }>;
      const strengthCurve = generateStrengthCurve(typedSets);

      if (strengthCurve.length >= 2) {
        // Calculate monthly gain
        const { gainKg, gainPercent, trend } = calculateMonthlyGain(strengthCurve);

        // Insight 1: Weight gain prediction
        if (gainKg > 0 && trend === 'increasing') {
          insights.push({
            type: 'weight_gain',
            exercise_name: exercise.exercise_library.name,
            exercise_id: exercise.exercise_library_id,
            message: `You're on track to add ${gainKg.toFixed(1)}kg to ${exercise.exercise_library.name} this month`,
            prediction: {
              weight_kg: strengthCurve[strengthCurve.length - 1].estimated_1rm_kg + gainKg,
              timeframe: '1 month',
              confidence: 0.7,
            },
          });
        }

        // Insight 2: Strength score increase
        if (gainPercent > 0) {
          insights.push({
            type: 'strength_increase',
            exercise_name: exercise.exercise_library.name,
            exercise_id: exercise.exercise_library_id,
            message: `Strength increased by ${gainPercent.toFixed(1)}% this month on ${exercise.exercise_library.name}`,
          });
        }
      }

      // Stop if we have enough insights
      if (insights.length >= limit) break;
    }

    // Add consistency insight if available
    if (insights.length < limit) {
      const { data: recentSessions } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false });

      if (recentSessions && recentSessions.length >= 8) {
        insights.push({
          type: 'consistency',
          exercise_name: 'Training',
          exercise_id: '',
          message: `Excellent consistency! You've completed ${recentSessions.length} workouts this month`,
        });
      }
    }

    return NextResponse.json({ insights: insights.slice(0, limit) });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
