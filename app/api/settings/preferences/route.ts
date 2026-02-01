import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
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
        });
      }
      throw error;
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
