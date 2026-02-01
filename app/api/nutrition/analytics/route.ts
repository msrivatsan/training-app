/**
 * Nutrition Analytics API
 *
 * Handles nutrition statistics and analytics
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly'; // weekly, daily_summary, weight_correlation
    const days = parseInt(searchParams.get('days') || '30');

    if (type === 'daily_summary') {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      const { data: summaries, error } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching daily summaries:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ summaries: summaries || [] });
    }

    if (type === 'weekly') {
      const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date()), 'yyyy-MM-dd');

      const { data: summaries, error } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd);

      if (error) {
        console.error('Error fetching weekly summaries:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Calculate weekly stats
      const daysLogged = summaries?.length || 0;
      const avgCalories = daysLogged > 0
        ? summaries!.reduce((sum, s) => sum + s.total_calories, 0) / daysLogged
        : 0;
      const avgProtein = daysLogged > 0
        ? summaries!.reduce((sum, s) => sum + s.total_protein, 0) / daysLogged
        : 0;
      const avgCarbs = daysLogged > 0
        ? summaries!.reduce((sum, s) => sum + s.total_carbs, 0) / daysLogged
        : 0;
      const avgFats = daysLogged > 0
        ? summaries!.reduce((sum, s) => sum + s.total_fats, 0) / daysLogged
        : 0;
      const avgWater = daysLogged > 0
        ? summaries!.reduce((sum, s) => sum + s.total_water_ml, 0) / daysLogged
        : 0;

      const daysHitProtein = summaries?.filter(s => s.hit_protein_target).length || 0;
      const daysHitCalories = summaries?.filter(s => s.hit_calorie_target).length || 0;
      const daysHitWater = summaries?.filter(s => s.hit_water_target).length || 0;

      const complianceScore = daysLogged > 0
        ? Math.round(((daysHitProtein + daysHitCalories + daysHitWater) / (daysLogged * 3)) * 100)
        : 0;

      return NextResponse.json({
        week_start: weekStart,
        week_end: weekEnd,
        average_calories: Math.round(avgCalories),
        average_protein: Math.round(avgProtein),
        average_carbs: Math.round(avgCarbs),
        average_fats: Math.round(avgFats),
        average_water_ml: Math.round(avgWater),
        days_logged: daysLogged,
        days_hit_protein: daysHitProtein,
        days_hit_calories: daysHitCalories,
        days_hit_water: daysHitWater,
        compliance_score: complianceScore,
      });
    }

    if (type === 'weight_correlation') {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      // Fetch nutrition summaries
      const { data: summaries, error: summariesError } = await supabase
        .from('daily_nutrition_summary')
        .select('date, total_calories')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (summariesError) {
        console.error('Error fetching summaries:', summariesError);
        return NextResponse.json({ error: summariesError.message }, { status: 500 });
      }

      // Fetch body measurements (weight)
      const { data: measurements, error: measurementsError } = await supabase
        .from('body_measurements')
        .select('date, weight_kg')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (measurementsError) {
        console.error('Error fetching measurements:', measurementsError);
        return NextResponse.json({ error: measurementsError.message }, { status: 500 });
      }

      // Merge data by date
      const dataPoints = summaries?.map(s => {
        const measurement = measurements?.find(m => m.date === s.date);
        return {
          date: s.date,
          calories: s.total_calories,
          weight_kg: measurement?.weight_kg || null,
        };
      }).filter(d => d.weight_kg !== null) || [];

      // Calculate trend
      let trend: 'gaining' | 'losing' | 'maintaining' = 'maintaining';
      let weeklyChangeKg = 0;

      if (dataPoints.length >= 7) {
        const recent = dataPoints.slice(-7);
        const first = recent[0].weight_kg!;
        const last = recent[recent.length - 1].weight_kg!;
        weeklyChangeKg = last - first;

        if (weeklyChangeKg > 0.2) trend = 'gaining';
        else if (weeklyChangeKg < -0.2) trend = 'losing';
      }

      // Calculate average calories
      const avgCalories = dataPoints.length > 0
        ? dataPoints.reduce((sum, d) => sum + d.calories, 0) / dataPoints.length
        : 0;

      // Get nutrition goal for alignment check
      const { data: goal } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      let goalAlignment: 'on_track' | 'too_fast' | 'too_slow' = 'on_track';
      let suggestedAdjustment = 0;
      let message = '';

      if (goal) {
        const targetWeeklyChange = goal.goal_type === 'bulk' ? 0.5 :
                                  goal.goal_type === 'cut' ? -0.5 : 0;

        if (goal.goal_type === 'bulk') {
          if (weeklyChangeKg < targetWeeklyChange - 0.2) {
            goalAlignment = 'too_slow';
            suggestedAdjustment = 200; // Add 200 cal
            message = `You're averaging +${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Consider adding ${suggestedAdjustment} calories to hit your bulk target.`;
          } else if (weeklyChangeKg > targetWeeklyChange + 0.2) {
            goalAlignment = 'too_fast';
            suggestedAdjustment = -200;
            message = `You're averaging +${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Consider reducing ${Math.abs(suggestedAdjustment)} calories to avoid excess fat gain.`;
          } else {
            message = `You're averaging +${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Great progress!`;
          }
        } else if (goal.goal_type === 'cut') {
          if (weeklyChangeKg > targetWeeklyChange + 0.2) {
            goalAlignment = 'too_slow';
            suggestedAdjustment = -200;
            message = `You're averaging ${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Consider reducing ${Math.abs(suggestedAdjustment)} calories to hit your cut target.`;
          } else if (weeklyChangeKg < targetWeeklyChange - 0.2) {
            goalAlignment = 'too_fast';
            suggestedAdjustment = 200;
            message = `You're averaging ${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Consider adding ${suggestedAdjustment} calories to avoid losing muscle.`;
          } else {
            message = `You're averaging ${weeklyChangeKg.toFixed(1)}kg per week on ${Math.round(avgCalories)} cal/day. Great progress!`;
          }
        } else {
          message = `You're maintaining your weight at ${Math.round(avgCalories)} cal/day.`;
        }
      }

      return NextResponse.json({
        data_points: dataPoints,
        current_trend: trend,
        weekly_change_kg: parseFloat(weeklyChangeKg.toFixed(2)),
        average_daily_calories: Math.round(avgCalories),
        goal_alignment: goalAlignment,
        suggested_adjustment: suggestedAdjustment,
        message,
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in nutrition analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
