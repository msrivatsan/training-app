/**
 * Nutrition Goals API
 *
 * Handles CRUD operations for nutrition goals and macro calculations
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateMacros } from '@/lib/nutrition/macro-calculator';

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
    const { data: goals, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nutrition goals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get active goal
    const activeGoal = goals?.find((g) => g.is_active) || null;

    return NextResponse.json({
      goals: goals || [],
      active_goal: activeGoal,
    });
  } catch (error) {
    console.error('Error in nutrition goals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Calculate macros
    const macros = calculateMacros({
      weight_kg: body.current_weight_kg,
      height_cm: body.height_cm,
      age: body.age,
      gender: body.gender,
      activity_level: body.activity_level,
      goal_type: body.goal_type,
    });

    // Deactivate existing active goals
    await supabase
      .from('nutrition_goals')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Create new goal
    const { data: goal, error } = await supabase
      .from('nutrition_goals')
      .insert({
        user_id: user.id,
        goal_type: body.goal_type,
        activity_level: body.activity_level,
        current_weight_kg: body.current_weight_kg,
        target_weight_kg: body.target_weight_kg || null,
        height_cm: body.height_cm,
        age: body.age,
        gender: body.gender,
        daily_calories: macros.daily_calories,
        daily_protein_g: macros.daily_protein_g,
        daily_carbs_g: macros.daily_carbs_g,
        daily_fats_g: macros.daily_fats_g,
        daily_water_ml: macros.daily_water_ml,
        is_active: true,
        auto_adjust: body.auto_adjust !== undefined ? body.auto_adjust : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating nutrition goal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal, macros }, { status: 201 });
  } catch (error) {
    console.error('Error in nutrition goals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    // If updating macro-related fields, recalculate
    if (
      updates.current_weight_kg ||
      updates.height_cm ||
      updates.age ||
      updates.gender ||
      updates.activity_level ||
      updates.goal_type
    ) {
      // Get existing goal to merge with updates
      const { data: existingGoal } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (existingGoal) {
        const macros = calculateMacros({
          weight_kg: updates.current_weight_kg || existingGoal.current_weight_kg,
          height_cm: updates.height_cm || existingGoal.height_cm,
          age: updates.age || existingGoal.age,
          gender: updates.gender || existingGoal.gender,
          activity_level: updates.activity_level || existingGoal.activity_level,
          goal_type: updates.goal_type || existingGoal.goal_type,
        });

        updates.daily_calories = macros.daily_calories;
        updates.daily_protein_g = macros.daily_protein_g;
        updates.daily_carbs_g = macros.daily_carbs_g;
        updates.daily_fats_g = macros.daily_fats_g;
        updates.daily_water_ml = macros.daily_water_ml;
      }
    }

    const { data: goal, error } = await supabase
      .from('nutrition_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating nutrition goal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error in nutrition goals API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
