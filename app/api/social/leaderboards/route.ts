import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET leaderboard data
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'workouts'; // 'workouts', 'volume', 'xp', 'strength'
  const scope = searchParams.get('scope') || 'global'; // 'global', 'friends', 'local'
  const monthYear = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const ageGroup = searchParams.get('age_group');
  const experienceLevel = searchParams.get('experience_level');
  const location = searchParams.get('location');
  const limit = parseInt(searchParams.get('limit') || '50');

  let leaderboardData: any[] = [];

  if (type === 'strength') {
    // Strength scores leaderboard
    let query = supabase
      .from('strength_scores')
      .select(`
        user_id,
        total_score,
        squat_1rm,
        deadlift_1rm,
        bench_1rm,
        ohp_1rm,
        updated_at,
        user:users!strength_scores_user_id_fkey(id, name, avatar)
      `)
      .order('total_score', { ascending: false })
      .limit(limit);

    // Apply filters based on privacy settings
    const { data: eligibleUsers } = await supabase
      .from('user_privacy_settings')
      .select('user_id, age_group, experience_level, location_city')
      .eq('show_on_leaderboards', true);

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return NextResponse.json([]);
    }

    let userIds = eligibleUsers.map(u => u.user_id);

    // Apply filters
    if (ageGroup) {
      userIds = eligibleUsers.filter(u => u.age_group === ageGroup).map(u => u.user_id);
    }
    if (experienceLevel) {
      userIds = eligibleUsers.filter(u => u.experience_level === experienceLevel).map(u => u.user_id);
    }
    if (location) {
      userIds = eligibleUsers.filter(u => u.location_city === location).map(u => u.user_id);
    }

    if (scope === 'friends') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      const friendIds = friendships?.map(f =>
        f.user_id === session.user.id ? f.friend_id : f.user_id
      ) || [];

      userIds = userIds.filter(id => friendIds.includes(id));
    }

    query = query.in('user_id', userIds);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    leaderboardData = data.map((entry, index) => ({
      user_id: entry.user_id,
      user_name: entry.user?.name,
      user_avatar: entry.user?.avatar,
      rank: index + 1,
      value: entry.total_score,
      is_current_user: entry.user_id === session.user.id,
    }));
  } else {
    // Monthly stats leaderboard (workouts, volume, xp)
    let query = supabase
      .from('monthly_leaderboard_stats')
      .select(`
        *,
        user:users!monthly_leaderboard_stats_user_id_fkey(id, name, avatar)
      `)
      .eq('month_year', monthYear)
      .limit(limit);

    // Apply privacy filter
    const { data: eligibleUsers } = await supabase
      .from('user_privacy_settings')
      .select('user_id, age_group, experience_level, location_city')
      .eq('show_on_leaderboards', true);

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return NextResponse.json([]);
    }

    let userIds = eligibleUsers.map(u => u.user_id);

    // Apply filters
    if (ageGroup) {
      userIds = eligibleUsers.filter(u => u.age_group === ageGroup).map(u => u.user_id);
    }
    if (experienceLevel) {
      userIds = eligibleUsers.filter(u => u.experience_level === experienceLevel).map(u => u.user_id);
    }
    if (location) {
      userIds = eligibleUsers.filter(u => u.location_city === location).map(u => u.user_id);
    }

    if (scope === 'friends') {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      const friendIds = friendships?.map(f =>
        f.user_id === session.user.id ? f.friend_id : f.user_id
      ) || [];

      userIds = userIds.filter(id => friendIds.includes(id));
    }

    query = query.in('user_id', userIds);

    // Sort by requested type
    if (type === 'workouts') {
      query = query.order('workouts_completed', { ascending: false });
    } else if (type === 'volume') {
      query = query.order('total_volume_kg', { ascending: false });
    } else if (type === 'xp') {
      query = query.order('total_xp_earned', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    leaderboardData = data.map((entry, index) => ({
      user_id: entry.user_id,
      user_name: entry.user?.name,
      user_avatar: entry.user?.avatar,
      rank: index + 1,
      value: type === 'workouts' ? entry.workouts_completed :
             type === 'volume' ? entry.total_volume_kg :
             entry.total_xp_earned,
      is_current_user: entry.user_id === session.user.id,
      workouts_completed: entry.workouts_completed,
      total_volume_kg: entry.total_volume_kg,
      total_xp_earned: entry.total_xp_earned,
      prs_achieved: entry.prs_achieved,
      streak_days: entry.streak_days,
    }));
  }

  return NextResponse.json(leaderboardData);
}
