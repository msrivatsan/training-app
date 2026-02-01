/**
 * Personal Records API
 *
 * Returns all-time PRs, recent PRs, and predictions for next PRs
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { estimate1RM } from '@/lib/progression';
import { subDays } from 'date-fns';

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

  try {
    // Get all non-warmup sets
    const { data: sets, error } = await supabase
      .from('sets')
      .select(`
        id,
        weight_kg,
        reps,
        created_at,
        exercise_id,
        exercises!inner (
          id,
          name,
          exercise_library_id,
          exercise_library!inner (
            id,
            name,
            primary_muscle_group
          )
        ),
        workout_sessions!inner (
          id,
          user_id,
          status
        )
      `)
      .eq('workout_sessions.user_id', user.id)
      .eq('workout_sessions.status', 'completed')
      .eq('is_warmup', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching PRs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Track PRs by exercise
    const exercisePRs: Record<string, {
      exercise_id: string;
      exercise_name: string;
      muscle_group: string;
      all_time_pr: { weight_kg: number; reps: number; estimated_1rm: number; date: string };
      recent_prs: Array<{ weight_kg: number; reps: number; estimated_1rm: number; date: string }>;
      historical_1rms: number[];
    }> = {};

    sets?.forEach((set: any) => {
      const exerciseLibId = set.exercises.exercise_library_id;
      const exerciseName = set.exercises.exercise_library.name;
      const muscleGroup = set.exercises.exercise_library.primary_muscle_group;
      const estimated1RM = estimate1RM(set.weight_kg, set.reps);
      const setDate = new Date(set.created_at);

      if (!exercisePRs[exerciseLibId]) {
        exercisePRs[exerciseLibId] = {
          exercise_id: exerciseLibId,
          exercise_name: exerciseName,
          muscle_group: muscleGroup,
          all_time_pr: {
            weight_kg: set.weight_kg,
            reps: set.reps,
            estimated_1rm: estimated1RM,
            date: set.created_at,
          },
          recent_prs: [],
          historical_1rms: [],
        };
      }

      // Track all 1RMs for prediction
      exercisePRs[exerciseLibId].historical_1rms.push(estimated1RM);

      // Update all-time PR
      if (estimated1RM > exercisePRs[exerciseLibId].all_time_pr.estimated_1rm) {
        exercisePRs[exerciseLibId].all_time_pr = {
          weight_kg: set.weight_kg,
          reps: set.reps,
          estimated_1rm: estimated1RM,
          date: set.created_at,
        };

        // Add to recent PRs if within 30 days
        if (setDate >= thirtyDaysAgo) {
          exercisePRs[exerciseLibId].recent_prs.push({
            weight_kg: set.weight_kg,
            reps: set.reps,
            estimated_1rm: estimated1RM,
            date: set.created_at,
          });
        }
      }
    });

    // Calculate next PR predictions
    const predictions = Object.values(exercisePRs).map(pr => {
      const recentData = pr.historical_1rms.slice(0, 10); // Last 10 workouts
      if (recentData.length < 3) {
        return {
          exercise_id: pr.exercise_id,
          exercise_name: pr.exercise_name,
          current_1rm: pr.all_time_pr.estimated_1rm,
          predicted_next_pr: null,
          confidence: 'low',
          message: 'Need more data for prediction',
        };
      }

      // Simple linear regression for trend
      const avgImprovement = recentData.reduce((sum, val, idx, arr) => {
        if (idx === 0) return sum;
        return sum + (arr[idx - 1] - val);
      }, 0) / (recentData.length - 1);

      const predictedNext = pr.all_time_pr.estimated_1rm + Math.abs(avgImprovement) * 2;
      const confidence = avgImprovement > 0 ? 'high' : avgImprovement > -2 ? 'medium' : 'low';

      return {
        exercise_id: pr.exercise_id,
        exercise_name: pr.exercise_name,
        muscle_group: pr.muscle_group,
        current_1rm: Math.round(pr.all_time_pr.estimated_1rm * 10) / 10,
        predicted_next_pr: Math.round(predictedNext * 10) / 10,
        confidence,
        message: avgImprovement > 0
          ? `On track to hit ${Math.round(predictedNext)}kg soon!`
          : avgImprovement > -2
          ? 'Maintain consistency to break this PR'
          : 'Focus on form and recovery',
      };
    });

    // Format all-time PRs
    const allTimePRs = Object.values(exercisePRs).map(pr => ({
      exercise_id: pr.exercise_id,
      exercise_name: pr.exercise_name,
      muscle_group: pr.muscle_group,
      weight_kg: pr.all_time_pr.weight_kg,
      reps: pr.all_time_pr.reps,
      estimated_1rm: Math.round(pr.all_time_pr.estimated_1rm * 10) / 10,
      date: pr.all_time_pr.date,
    })).sort((a, b) => b.estimated_1rm - a.estimated_1rm);

    // Format recent PRs
    const recentPRs = Object.values(exercisePRs)
      .flatMap(pr => pr.recent_prs.map(rpr => ({
        exercise_id: pr.exercise_id,
        exercise_name: pr.exercise_name,
        muscle_group: pr.muscle_group,
        weight_kg: rpr.weight_kg,
        reps: rpr.reps,
        estimated_1rm: Math.round(rpr.estimated_1rm * 10) / 10,
        date: rpr.date,
      })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      all_time_prs: allTimePRs,
      recent_prs: recentPRs,
      predictions: predictions.sort((a, b) => (b.predicted_next_pr || 0) - (a.predicted_next_pr || 0)),
      summary: {
        total_exercises: allTimePRs.length,
        recent_pr_count: recentPRs.length,
        strongest_muscle_group: allTimePRs[0]?.muscle_group || null,
      },
    });
  } catch (error) {
    console.error('Error in personal records analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
