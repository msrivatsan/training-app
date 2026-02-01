/**
 * Analytics Insights API
 *
 * Provides smart recommendations and insights based on workout data
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { estimate1RM } from '@/lib/progression';
import { subDays, differenceInDays, format } from 'date-fns';

interface Insight {
  type: 'warning' | 'success' | 'info' | 'suggestion';
  category: 'progression' | 'balance' | 'recovery' | 'volume';
  message: string;
  action?: string;
}

export async function GET() {
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
    const insights: Insight[] = [];
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    // Get recent workout sessions
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(`
        id,
        started_at,
        total_volume_kg,
        workouts!inner (
          id,
          name,
          workout_type
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', thirtyDaysAgo.toISOString())
      .order('started_at', { ascending: false });

    // Get sets with exercises for detailed analysis
    const { data: sets } = await supabase
      .from('sets')
      .select(`
        id,
        weight_kg,
        reps,
        created_at,
        is_warmup,
        exercises!inner (
          id,
          name,
          exercise_library!inner (
            id,
            name,
            primary_muscle_group
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
      .gte('workout_sessions.started_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // INSIGHT 1: Check for muscle group neglect
    const muscleGroupLastWorked: Record<string, Date> = {};
    sets?.forEach((set: any) => {
      const muscle = set.exercises.exercise_library.primary_muscle_group;
      const date = new Date(set.created_at);
      if (!muscleGroupLastWorked[muscle] || date > muscleGroupLastWorked[muscle]) {
        muscleGroupLastWorked[muscle] = date;
      }
    });

    Object.entries(muscleGroupLastWorked).forEach(([muscle, lastDate]) => {
      const daysSince = differenceInDays(now, lastDate);
      if (daysSince >= 7) {
        insights.push({
          type: 'warning',
          category: 'balance',
          message: `You haven't trained ${muscle} in ${daysSince} days`,
          action: `Schedule a workout targeting ${muscle}`,
        });
      }
    });

    // INSIGHT 2: Exercise-specific progression analysis
    const exerciseProgress: Record<string, Array<{ weight: number; reps: number; date: Date; estimated1RM: number }>> = {};

    sets?.forEach((set: any) => {
      const exerciseId = set.exercises.exercise_library_id;
      const exerciseName = set.exercises.exercise_library.name;
      const estimated1RM = estimate1RM(set.weight_kg, set.reps);

      if (!exerciseProgress[exerciseId]) {
        exerciseProgress[exerciseId] = [];
      }

      exerciseProgress[exerciseId].push({
        weight: set.weight_kg,
        reps: set.reps,
        date: new Date(set.created_at),
        estimated1RM,
      });
    });

    // Analyze progression trends
    Object.entries(exerciseProgress).forEach(([exerciseId, dataPoints]) => {
      if (dataPoints.length < 3) return;

      // Sort by date
      const sorted = dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
      const recent = sorted.slice(-5);
      const older = sorted.slice(-10, -5);

      if (recent.length < 2 || older.length < 2) return;

      const recentAvg1RM = recent.reduce((sum, dp) => sum + dp.estimated1RM, 0) / recent.length;
      const olderAvg1RM = older.reduce((sum, dp) => sum + dp.estimated1RM, 0) / older.length;

      const progressRate = ((recentAvg1RM - olderAvg1RM) / olderAvg1RM) * 100;

      // Get exercise name from the first data point
      const exerciseName = sets?.find((s: any) => s.exercises.exercise_library_id === exerciseId)?.exercises.exercise_library.name || 'Exercise';

      if (progressRate > 10) {
        insights.push({
          type: 'success',
          category: 'progression',
          message: `Your ${exerciseName} is progressing rapidly (+${progressRate.toFixed(1)}%)`,
        });
      } else if (progressRate < -5) {
        insights.push({
          type: 'warning',
          category: 'progression',
          message: `Your ${exerciseName} strength has decreased (${progressRate.toFixed(1)}%)`,
          action: 'Consider a deload or form check',
        });
      }
    });

    // INSIGHT 3: Volume analysis
    if (sessions && sessions.length > 0) {
      const recentSessions = sessions.slice(0, 5);
      const avgVolume = recentSessions.reduce((sum: number, s: any) => sum + (s.total_volume_kg || 0), 0) / recentSessions.length;

      // Check last session volume
      const lastSession = sessions[0];
      const lastVolume = lastSession.total_volume_kg || 0;

      if (lastVolume > avgVolume * 1.4) {
        insights.push({
          type: 'warning',
          category: 'volume',
          message: `Your last workout volume was 40% higher than average (${Math.round(lastVolume)}kg vs ${Math.round(avgVolume)}kg)`,
          action: 'Monitor recovery and consider reducing volume next session',
        });
      }

      // Check workout frequency
      const sevenDaysAgo = subDays(now, 7);
      const recentWorkouts = sessions.filter((s: any) => new Date(s.started_at) >= sevenDaysAgo);

      if (recentWorkouts.length === 0) {
        insights.push({
          type: 'warning',
          category: 'recovery',
          message: "You haven't worked out in the past 7 days",
          action: 'Get back on track with a lighter session',
        });
      } else if (recentWorkouts.length === 1) {
        insights.push({
          type: 'info',
          category: 'recovery',
          message: "You've only trained once this week",
          action: 'Aim for at least 3 sessions per week for optimal progress',
        });
      } else if (recentWorkouts.length >= 6) {
        insights.push({
          type: 'warning',
          category: 'recovery',
          message: `You've trained ${recentWorkouts.length} times this week`,
          action: 'Ensure you have adequate rest days for recovery',
        });
      }
    } else {
      insights.push({
        type: 'info',
        category: 'recovery',
        message: 'No workouts in the past 30 days',
        action: 'Start your fitness journey today!',
      });
    }

    // INSIGHT 4: Workout type balance
    const workoutTypeCount: Record<string, number> = {};
    sessions?.forEach((session: any) => {
      const type = session.workouts.workout_type;
      workoutTypeCount[type] = (workoutTypeCount[type] || 0) + 1;
    });

    const strengthCount = workoutTypeCount['strength'] || 0;
    const hypertrophyCount = workoutTypeCount['hypertrophy'] || 0;
    const total = strengthCount + hypertrophyCount;

    if (total > 0 && strengthCount > hypertrophyCount * 2) {
      insights.push({
        type: 'suggestion',
        category: 'balance',
        message: 'You have significantly more strength-focused workouts than hypertrophy',
        action: 'Consider adding more volume work for muscle growth',
      });
    } else if (total > 0 && hypertrophyCount > strengthCount * 2) {
      insights.push({
        type: 'suggestion',
        category: 'balance',
        message: 'You have significantly more hypertrophy-focused workouts than strength',
        action: 'Consider adding heavy compound lifts to build strength',
      });
    }

    // INSIGHT 5: Compare exercises within same muscle group
    const muscleGroupExercises: Record<string, Record<string, number>> = {};

    sets?.forEach((set: any) => {
      const muscle = set.exercises.exercise_library.primary_muscle_group;
      const exerciseName = set.exercises.exercise_library.name;
      const estimated1RM = estimate1RM(set.weight_kg, set.reps);

      if (!muscleGroupExercises[muscle]) {
        muscleGroupExercises[muscle] = {};
      }

      if (!muscleGroupExercises[muscle][exerciseName]) {
        muscleGroupExercises[muscle][exerciseName] = estimated1RM;
      } else {
        muscleGroupExercises[muscle][exerciseName] = Math.max(
          muscleGroupExercises[muscle][exerciseName],
          estimated1RM
        );
      }
    });

    // Check for imbalances within muscle groups
    Object.entries(muscleGroupExercises).forEach(([muscle, exercises]) => {
      const exerciseNames = Object.keys(exercises);
      if (exerciseNames.length >= 2) {
        const values = Object.values(exercises);
        const max = Math.max(...values);
        const min = Math.min(...values);

        if (max > min * 1.5) {
          const strongestEx = exerciseNames[values.indexOf(max)];
          const weakestEx = exerciseNames[values.indexOf(min)];

          insights.push({
            type: 'info',
            category: 'balance',
            message: `Your ${strongestEx} is significantly stronger than ${weakestEx}`,
            action: `Focus on improving ${weakestEx} form and strength`,
          });
        }
      }
    });

    // Sort insights by priority (warnings first, then suggestions, success, info)
    const priorityOrder = { warning: 1, suggestion: 2, success: 3, info: 4 };
    const sortedInsights = insights.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

    return NextResponse.json({
      insights: sortedInsights.slice(0, 10), // Limit to top 10 insights
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
