/**
 * Meal Templates API
 *
 * Handles meal template operations for quick logging
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
    const { data: templates, error } = await supabase
      .from('meal_templates')
      .select(`
        *,
        items:meal_template_items(
          *,
          food:foods(*)
        )
      `)
      .eq('user_id', user.id)
      .order('use_count', { ascending: false });

    if (error) {
      console.error('Error fetching meal templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error in meal templates API:', error);
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

    if (!body.name || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Template name and items are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    body.items.forEach((item: any) => {
      const multiplier = (item.serving_size_g / 100) * item.servings;
      totalCalories += item.food.calories_per_100g * multiplier;
      totalProtein += item.food.protein_per_100g * multiplier;
      totalCarbs += item.food.carbs_per_100g * multiplier;
      totalFats += item.food.fats_per_100g * multiplier;
    });

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('meal_templates')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        meal_type: body.meal_type || null,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fats: totalFats,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating meal template:', templateError);
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }

    // Insert template items
    const templateItems = body.items.map((item: any, index: number) => ({
      template_id: template.id,
      food_id: item.food_id,
      serving_size_g: item.serving_size_g,
      servings: item.servings,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from('meal_template_items')
      .insert(templateItems);

    if (itemsError) {
      console.error('Error creating template items:', itemsError);
      // Rollback template
      await supabase.from('meal_templates').delete().eq('id', template.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Fetch complete template
    const { data: completeTemplate, error: fetchError } = await supabase
      .from('meal_templates')
      .select(`
        *,
        items:meal_template_items(
          *,
          food:foods(*)
        )
      `)
      .eq('id', template.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete template:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ template: completeTemplate }, { status: 201 });
  } catch (error) {
    console.error('Error in meal templates API:', error);
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
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('meal_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting meal template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in meal templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
