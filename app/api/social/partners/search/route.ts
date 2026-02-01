import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET search for training partners
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goals = searchParams.get('goals')?.split(',');
  const days = searchParams.get('days')?.split(',');
  const time = searchParams.get('time');

  // Get user's own profile for matching
  const { data: userProfile } = await supabase
    .from('training_partner_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  // Get all active partner profiles (excluding current user)
  let query = supabase
    .from('training_partner_profiles')
    .select(`
      *,
      user:users!training_partner_profiles_user_id_fkey(id, name, avatar, fitness_level),
      privacy:user_privacy_settings!training_partner_profiles_user_id_fkey(
        location_city,
        experience_level
      )
    `)
    .eq('is_active', true)
    .neq('user_id', session.user.id);

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate match scores
  const matches = profiles.map(profile => {
    let matchScore = 0;

    // Match goals (30 points max)
    if (userProfile?.goals && profile.goals) {
      const commonGoals = userProfile.goals.filter((g: string) => profile.goals?.includes(g));
      matchScore += (commonGoals.length / userProfile.goals.length) * 30;
    }

    // Match available days (30 points max)
    if (userProfile?.available_days && profile.available_days) {
      const commonDays = userProfile.available_days.filter((d: string) =>
        profile.available_days?.includes(d)
      );
      matchScore += (commonDays.length / userProfile.available_days.length) * 30;
    }

    // Match preferred time (20 points max)
    if (userProfile?.preferred_time && profile.preferred_time === userProfile.preferred_time) {
      matchScore += 20;
    }

    // Proximity bonus (20 points max) - if both have location set
    const userCity = (session.user as any).privacy?.location_city;
    const profileCity = profile.privacy?.location_city;
    if (userCity && profileCity && userCity === profileCity) {
      matchScore += 20;
    }

    return {
      ...profile,
      user_name: profile.user?.name,
      user_avatar: profile.user?.avatar,
      fitness_level: profile.user?.fitness_level,
      location_city: profile.privacy?.location_city,
      match_score: Math.round(matchScore),
    };
  });

  // Sort by match score
  matches.sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json(matches.slice(0, 20));
}
