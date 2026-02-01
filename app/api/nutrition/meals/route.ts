/**
 * Meal Logs API
 *
 * Handles meal logging operations
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let queryBuilder = supabase
      .from('meal_logs')
      .select(`
        *,
        items:meal_log_items(
          *,
          food:foods(*)
        )
      `)
      .eq('user_id', user.id);

    if (date) {
      queryBuilder = queryBuilder.eq('date', date);
    } else if (startDate && endDate) {
      queryBuilder = queryBuilder
        .gte('date', startDate)
        .lte('date', endDate);
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      queryBuilder = queryBuilder.eq('date', today);
    }

    queryBuilder = queryBuilder.order('logged_at', { ascending: false });

    const { data: meals, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching meal logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meals: meals || [] });
  } catch (error) {
    console.error('Error in meal logs API:', error);
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

    // Validate required fields
    if (!body.meal_type || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Meal type and items are required' },
        { status: 400 }
      );
    }

    // Create meal log
    const { data: mealLog, error: mealError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        date: body.date || new Date().toISOString().split('T')[0],
        meal_type: body.meal_type,
        meal_name: body.meal_name || null,
        notes: body.notes || null,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fats: 0,
      })
      .select()
      .single();

    if (mealError) {
      console.error('Error creating meal log:', mealError);
      return NextResponse.json({ error: mealError.message }, { status: 500 });
    }

    // Calculate macros for each food item
    const itemsWithMacros = body.items.map((item: any) => {
      const multiplier = (item.serving_size_g / 100) * item.servings;
      return {
        meal_log_id: mealLog.id,
        food_id: item.food_id,
        serving_size_g: item.serving_size_g,
        servings: item.servings,
        calories: item.food.calories_per_100g * multiplier,
        protein: item.food.protein_per_100g * multiplier,
        carbs: item.food.carbs_per_100g * multiplier,
        fats: item.food.fats_per_100g * multiplier,
      };
    });

    // Insert meal log items
    const { error: itemsError } = await supabase
      .from('meal_log_items')
      .insert(itemsWithMacros);

    if (itemsError) {
      console.error('Error creating meal log items:', itemsError);
      // Rollback meal log
      await supabase.from('meal_logs').delete().eq('id', mealLog.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch complete meal log with items
    const { data: completeMeal, error: fetchError } = await supabase
      .from('meal_logs')
      .select(`
        *,
        items:meal_log_items(
          *,
          food:foods(*)
        )
      `)
      .eq('id', mealLog.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete meal log:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ meal: completeMeal }, { status: 201 });
  } catch (error) {
    console.error('Error in meal logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const mealId = searchParams.get('id');

    if (!mealId) {
      return NextResponse.json(
        { error: 'Meal ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting meal log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in meal logs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
