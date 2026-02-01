/**
 * Workout History API
 *
 * Returns calendar-formatted workout history with filters
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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
  const months = parseInt(searchParams.get('months') || '3');
  const workoutType = searchParams.get('type'); // 'strength', 'hypertrophy', etc.

  try {
    const endDate = endOfMonth(new Date());
    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    // Build query
    let query = supabase
      .from('workout_sessions')
      .select(`
        id,
        started_at,
        completed_at,
        duration_minutes,
        total_volume_kg,
        status,
        workouts!inner (
          id,
          name,
          workout_type,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .order('started_at', { ascending: true });

    // Filter by workout type if provided
    if (workoutType) {
      query = query.eq('workouts.workout_type', workoutType);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching workout history:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format for calendar view
    const calendarData: Record<string, {
      date: string;
      workouts: Array<{
        id: string;
        name: string;
        type: string;
        duration_minutes: number | null;
        volume_kg: number | null;
        time: string;
      }>;
    }> = {};

    sessions?.forEach((session: any) => {
      const dateKey = format(new Date(session.started_at), 'yyyy-MM-dd');

      if (!calendarData[dateKey]) {
        calendarData[dateKey] = {
          date: dateKey,
          workouts: [],
        };
      }

      calendarData[dateKey].workouts.push({
        id: session.id,
        name: session.workouts.name,
        type: session.workouts.workout_type,
        duration_minutes: session.duration_minutes,
        volume_kg: session.total_volume_kg,
        time: format(new Date(session.started_at), 'HH:mm'),
      });
    });

    // Calculate statistics
    const totalWorkouts = sessions?.length || 0;
    const totalVolume = sessions?.reduce((sum: number, s: any) => sum + (s.total_volume_kg || 0), 0) || 0;
    const avgDuration = sessions?.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / (totalWorkouts || 1);

    // Workout type distribution
    const typeDistribution: Record<string, number> = {};
    sessions?.forEach((session: any) => {
      const type = session.workouts.workout_type;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return NextResponse.json({
      calendar: Object.values(calendarData).sort((a, b) => a.date.localeCompare(b.date)),
      statistics: {
        total_workouts: totalWorkouts,
        total_volume_kg: Math.round(totalVolume),
        average_duration_minutes: Math.round(avgDuration),
        type_distribution: typeDistribution,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error in workout history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
