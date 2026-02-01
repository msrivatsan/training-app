import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET all active challenges with user's progress
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all active challenges
  const { data: challenges, error } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user's progress for each challenge
  const challengeIds = challenges.map(c => c.id);
  const { data: userProgress } = await supabase
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', session.user.id)
    .in('challenge_id', challengeIds);

  const progressMap = new Map(userProgress?.map(p => [p.challenge_id, p]));

  // Combine challenges with user progress
  const challengesWithProgress = challenges.map(challenge => {
    const progress = progressMap.get(challenge.id);
    const progressPercentage = progress
      ? Math.min(100, (progress.current_value / challenge.target_value) * 100)
      : 0;

    return {
      ...challenge,
      user_progress: progress,
      progress_percentage: progressPercentage,
    };
  });

  return NextResponse.json(challengesWithProgress);
}

// POST join a challenge
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { challenge_id } = await request.json();

  if (!challenge_id) {
    return NextResponse.json({ error: 'challenge_id is required' }, { status: 400 });
  }

  // Create user progress entry
  const { data, error } = await supabase
    .from('user_challenge_progress')
    .insert({
      challenge_id,
      user_id: session.user.id,
      current_value: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already joined this challenge' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
