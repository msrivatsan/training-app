/**
 * Body Measurements API
 *
 * Handles CRUD operations for body measurements
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

  try {
    const { data: measurements, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching body measurements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      measurements: measurements || [],
    });
  } catch (error) {
    console.error('Error in body measurements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    const { data: measurement, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: user.id,
        date: body.date || new Date().toISOString(),
        weight_kg: body.weight_kg,
        body_fat_percentage: body.body_fat_percentage,
        muscle_mass_kg: body.muscle_mass_kg,
        chest_cm: body.chest_cm,
        waist_cm: body.waist_cm,
        hips_cm: body.hips_cm,
        bicep_left_cm: body.bicep_left_cm,
        bicep_right_cm: body.bicep_right_cm,
        thigh_left_cm: body.thigh_left_cm,
        thigh_right_cm: body.thigh_right_cm,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating body measurement:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    console.error('Error in body measurements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
