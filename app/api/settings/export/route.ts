import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { export_type, format } = body;

    // Fetch all user data
    const [
      { data: workoutSessions },
      { data: bodyMeasurements },
      { data: exercises },
      { data: programs },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*, sets(*)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false }),
      supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('programs')
        .select('*, workouts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
    ]);

    // Convert to CSV format
    const workoutsCSV = convertWorkoutsToCSV(workoutSessions || []);
    const bodyStatsCSV = convertBodyStatsToCSV(bodyMeasurements || []);
    const exercisePRsCSV = convertExercisePRsToCSV(workoutSessions || []);

    // For simplicity, return JSON (in production, would create actual ZIP)
    // You would use a library like 'jszip' to create actual ZIP files
    const exportData = {
      profile,
      workouts: workoutSessions,
      body_measurements: bodyMeasurements,
      programs,
      csv: {
        workouts: workoutsCSV,
        body_stats: bodyStatsCSV,
        exercise_prs: exercisePRsCSV,
      },
      exported_at: new Date().toISOString(),
    };

    // In production, you would:
    // 1. Create a ZIP file with JSZip
    // 2. Upload to cloud storage (S3, etc.)
    // 3. Return download URL
    // For now, return JSON data
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="iron-quest-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Helper functions to convert data to CSV
function convertWorkoutsToCSV(workoutSessions: any[]): string {
  const headers = ['Date', 'Duration (min)', 'Total Volume (kg)', 'Exercises', 'Sets', 'Status'];
  const rows = workoutSessions.map(session => [
    new Date(session.started_at).toISOString().split('T')[0],
    session.duration_minutes || 0,
    session.total_volume_kg || 0,
    session.sets?.length || 0,
    session.sets?.reduce((sum: number, set: any) => sum + 1, 0) || 0,
    session.status,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertBodyStatsToCSV(measurements: any[]): string {
  const headers = ['Date', 'Weight (kg)', 'Body Fat %', 'Muscle Mass (kg)', 'Notes'];
  const rows = measurements.map(m => [
    m.date,
    m.weight_kg || '',
    m.body_fat_percentage || '',
    m.muscle_mass_kg || '',
    m.notes || '',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function convertExercisePRsToCSV(workoutSessions: any[]): string {
  const headers = ['Exercise', 'Weight (kg)', 'Reps', 'Date', '1RM Estimate'];
  const prs: Record<string, any> = {};

  // Calculate PRs from workout sessions
  workoutSessions.forEach(session => {
    session.sets?.forEach((set: any) => {
      if (!set.is_warmup) {
        const key = set.exercise_id;
        const oneRM = set.weight_kg * (1 + set.reps / 30); // Epley formula

        if (!prs[key] || prs[key].oneRM < oneRM) {
          prs[key] = {
            exercise: set.exercise?.name || 'Unknown',
            weight: set.weight_kg,
            reps: set.reps,
            date: session.started_at,
            oneRM: oneRM.toFixed(1),
          };
        }
      }
    });
  });

  const rows = Object.values(prs).map((pr: any) => [
    pr.exercise,
    pr.weight,
    pr.reps,
    new Date(pr.date).toISOString().split('T')[0],
    pr.oneRM,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
