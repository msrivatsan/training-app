import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MilestoneTracking, Set } from '@/lib/types';
import { generateStrengthCurve, predictMilestoneAchievement } from '@/lib/performance-predictor';

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

    // Get active milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestone_tracking')
      .select(`
        *,
        exercise:exercise_library (
          id,
          name,
          is_compound
        )
      `)
      .eq('user_id', userId)
      .eq('exercise_library_id', exerciseId)
      .eq('status', 'in_progress')
      .single();

    if (milestoneError && milestoneError.code !== 'PGRST116') {
      throw milestoneError;
    }

    // If no milestone exists, return null
    if (!milestone) {
      return NextResponse.json({ milestone: null });
    }

    // Get recent sets to update predictions
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
            user_id
          )
        )
      `)
      .eq('exercise.exercise_library_id', exerciseId)
      .eq('exercise.workout_sessions.user_id', userId)
      .eq('is_warmup', false)
      .order('created_at', { ascending: false })
      .limit(30);

    if (setsError) throw setsError;

    // Generate strength curve and update predictions
    if (sets && sets.length > 0) {
      const typedSets = sets as unknown as Array<Set & { created_at: string }>;
      const strengthCurve = generateStrengthCurve(typedSets);

      const prediction = predictMilestoneAchievement({
        strengthCurve,
        targetWeight: milestone.target_weight_kg,
        targetReps: milestone.target_reps,
      });

      // Update milestone with new predictions
      await supabase
        .from('milestone_tracking')
        .update({
          current_estimated_1rm_kg: prediction.currentEstimated1RM,
          predicted_achievement_date: prediction.predictedDate?.toISOString().split('T')[0],
          weeks_to_achievement: prediction.weeksToAchievement,
          achievement_probability: prediction.achievementProbability,
        })
        .eq('id', milestone.id);

      // Return updated milestone
      return NextResponse.json({
        milestone: {
          ...milestone,
          current_estimated_1rm_kg: prediction.currentEstimated1RM,
          predicted_achievement_date: prediction.predictedDate?.toISOString().split('T')[0],
          weeks_to_achievement: prediction.weeksToAchievement,
          achievement_probability: prediction.achievementProbability,
        },
      });
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, exerciseLibraryId, targetWeight, targetReps = 1 } = body;

    if (!userId || !exerciseLibraryId || !targetWeight) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create new milestone
    const { data, error } = await supabase
      .from('milestone_tracking')
      .insert({
        user_id: userId,
        exercise_library_id: exerciseLibraryId,
        target_weight_kg: targetWeight,
        target_reps: targetReps,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ milestone: data });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}
