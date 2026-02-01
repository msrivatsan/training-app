/**
 * Water Tracking API
 *
 * Handles water intake logging
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const { data: logs, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('Error fetching water logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = logs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;

    return NextResponse.json({
      logs: logs || [],
      total_ml: total,
    });
  } catch (error) {
    console.error('Error in water API:', error);
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

    if (!body.amount_ml || body.amount_ml <= 0) {
      return NextResponse.json(
        { error: 'Valid amount required' },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: user.id,
        date: body.date || new Date().toISOString().split('T')[0],
        amount_ml: body.amount_ml,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating water log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Error in water API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
