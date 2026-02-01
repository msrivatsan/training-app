/**
 * Foods API
 *
 * Handles food database operations (search, create custom foods, etc.)
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
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const barcode = searchParams.get('barcode');
    const recent = searchParams.get('recent') === 'true';

    // Barcode lookup
    if (barcode) {
      const { data: food, error } = await supabase
        .from('foods')
        .select('*')
        .eq('barcode', barcode)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching food by barcode:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ food: food || null });
    }

    // Recent foods
    if (recent) {
      const { data: recentFoods, error } = await supabase
        .from('recent_foods')
        .select(`
          *,
          food:foods(*)
        `)
        .eq('user_id', user.id)
        .order('last_used_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching recent foods:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        foods: recentFoods?.map(rf => rf.food) || []
      });
    }

    // Search foods
    let queryBuilder = supabase
      .from('foods')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`);

    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    queryBuilder = queryBuilder
      .order('is_verified', { ascending: false })
      .order('name', { ascending: true })
      .limit(50);

    const { data: foods, error } = await queryBuilder;

    if (error) {
      console.error('Error searching foods:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ foods: foods || [] });
  } catch (error) {
    console.error('Error in foods API:', error);
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
    if (!body.name || body.calories_per_100g === undefined ||
        body.protein_per_100g === undefined || body.carbs_per_100g === undefined ||
        body.fats_per_100g === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: food, error } = await supabase
      .from('foods')
      .insert({
        user_id: user.id,
        name: body.name,
        brand: body.brand || null,
        barcode: body.barcode || null,
        calories_per_100g: body.calories_per_100g,
        protein_per_100g: body.protein_per_100g,
        carbs_per_100g: body.carbs_per_100g,
        fats_per_100g: body.fats_per_100g,
        fiber_per_100g: body.fiber_per_100g || 0,
        sugar_per_100g: body.sugar_per_100g || 0,
        sodium_mg_per_100g: body.sodium_mg_per_100g || 0,
        default_serving_size_g: body.default_serving_size_g || 100,
        serving_unit: body.serving_unit || 'g',
        category: body.category || null,
        tags: body.tags || [],
        source: 'user',
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating food:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ food }, { status: 201 });
  } catch (error) {
    console.error('Error in foods API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
