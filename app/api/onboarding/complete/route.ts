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
    const { weight, experienceLevel, goals, programTemplate, availableEquipment, notificationsEnabled } = body;

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        weight_kg: parseFloat(weight) || null,
        fitness_level: experienceLevel,
        goals: goals,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Create user preferences
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        unit_system: 'metric',
        weight_unit: 'kg',
        distance_unit: 'cm',
        rest_timer_auto_start: true,
        default_rest_compound: 180,
        default_rest_isolation: 90,
        default_rest_cardio: 60,
        show_warmup_sets: true,
        enable_rpe_tracking: true,
        show_plate_calculator: true,
        available_plate_weights: [2.5, 5, 10, 15, 20, 25],
        barbell_weight_kg: 20,
        auto_start_rest_timer: true,
        vibrate_on_timer_end: true,
        play_sound_on_timer_end: true,
        updated_at: new Date().toISOString(),
      });

    // Create equipment profile
    if (availableEquipment && availableEquipment.length > 0) {
      await supabase
        .from('equipment_profiles')
        .upsert({
          user_id: user.id,
          profile_name: 'Default',
          available_equipment: availableEquipment,
          is_active: true,
          updated_at: new Date().toISOString(),
        });
    }

    // Update notification preferences
    if (notificationsEnabled) {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          workout_reminder_enabled: true,
          rest_day_reminder_enabled: true,
          deload_week_alert_enabled: true,
          streak_milestone_enabled: true,
          achievement_unlocked_enabled: true,
          friend_activity_enabled: true,
          weekly_summary_enabled: true,
          push_notifications_enabled: true,
          email_notifications_enabled: true,
          sms_notifications_enabled: false,
          quiet_hours_start: 22,
          quiet_hours_end: 8,
          reminder_minutes_before: 30,
          updated_at: new Date().toISOString(),
        });
    }

    // Mark onboarding as complete
    await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: user.id,
        welcome_completed: true,
        profile_setup_completed: true,
        goals_setup_completed: true,
        program_selection_completed: true,
        equipment_setup_completed: true,
        notifications_setup_completed: true,
        tutorial_completed: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    // Initialize user level (if not already exists)
    const { data: existingLevel } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existingLevel) {
      await supabase.from('user_levels').insert({
        user_id: user.id,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100,
        title: 'Novice Lifter',
      });
    }

    // Initialize workout streak (if not already exists)
    const { data: existingStreak } = await supabase
      .from('workout_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existingStreak) {
      await supabase.from('workout_streaks').insert({
        user_id: user.id,
        current_streak: 0,
        longest_streak: 0,
        streak_milestones: [],
      });
    }

    // Create training age record
    await supabase
      .from('training_age')
      .upsert({
        user_id: user.id,
        training_start_date: new Date().toISOString().split('T')[0],
        years_training: 0,
        months_training: 0,
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
