import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Search for users by username/name
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  // Search for users (excluding current user)
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      name,
      avatar,
      fitness_level
    `)
    .neq('id', session.user.id)
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get privacy settings for each user
  const userIds = users.map(u => u.id);
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('user_id, allow_friend_requests, profile_visibility')
    .in('user_id', userIds);

  // Get existing friendship status
  const { data: friendships } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', session.user.id)
    .in('friend_id', userIds);

  const friendshipMap = new Map(friendships?.map(f => [f.friend_id, f.status]));
  const privacyMap = new Map(privacySettings?.map(p => [p.user_id, p]));

  // Filter and enrich results
  const results = users
    .filter(u => {
      const privacy = privacyMap.get(u.id);
      return !privacy || privacy.profile_visibility !== 'private' || friendshipMap.has(u.id);
    })
    .map(u => ({
      ...u,
      friendship_status: friendshipMap.get(u.id),
      allow_friend_requests: privacyMap.get(u.id)?.allow_friend_requests ?? true,
    }));

  return NextResponse.json(results);
}
