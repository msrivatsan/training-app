import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// PUT update challenge progress
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { current_value } = await request.json();

  if (current_value === undefined) {
    return NextResponse.json({ error: 'current_value is required' }, { status: 400 });
  }

  // Get challenge details
  const { data: challenge } = await supabase
    .from('weekly_challenges')
    .select('target_value, bonus_xp, xp_multiplier')
    .eq('id', params.id)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  const completed = current_value >= challenge.target_value;

  // Update progress
  const { data: progress, error } = await supabase
    .from('user_challenge_progress')
    .update({
      current_value,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('challenge_id', params.id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If just completed, award bonus XP
  if (completed && !progress.completed) {
    await supabase.from('xp_transactions').insert({
      user_id: session.user.id,
      xp_amount: challenge.bonus_xp,
      transaction_type: 'challenge_completed',
      description: `Completed weekly challenge`,
    });
  }

  return NextResponse.json(progress);
}
