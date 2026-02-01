import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CreatePostPayload } from '@/lib/types/social';

// GET social feed
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const filter = searchParams.get('filter') || 'all'; // 'all', 'friends', 'own'

  let query = supabase
    .from('workout_posts')
    .select(`
      *,
      user:users!workout_posts_user_id_fkey(id, name, avatar),
      session:workout_sessions!workout_posts_workout_session_id_fkey(
        duration_minutes,
        total_volume_kg
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'own') {
    query = query.eq('user_id', session.user.id);
  } else if (filter === 'friends') {
    // Get friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

    const friendIds = friendships?.map(f =>
      f.user_id === session.user.id ? f.friend_id : f.user_id
    ) || [];

    if (friendIds.length > 0) {
      query = query.in('user_id', friendIds);
    } else {
      return NextResponse.json([]); // No friends yet
    }
  } else {
    // 'all' - public posts and friends' posts
    query = query.or(`visibility.eq.public,user_id.eq.${session.user.id}`);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if user has reacted to each post
  const postIds = posts.map(p => p.id);
  const { data: userReactions } = await supabase
    .from('post_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', session.user.id)
    .in('post_id', postIds);

  const reactionsMap = new Map(userReactions?.map(r => [r.post_id, r.reaction_type]));

  // Enrich posts with user reaction info
  const enrichedPosts = posts.map(post => ({
    ...post,
    user_name: post.user?.name,
    user_avatar: post.user?.avatar,
    session_duration: post.session?.duration_minutes,
    session_volume: post.session?.total_volume_kg,
    has_user_reacted: reactionsMap.has(post.id),
    user_reaction_type: reactionsMap.get(post.id),
  }));

  return NextResponse.json(enrichedPosts);
}

// POST create a new workout post
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: CreatePostPayload = await request.json();

  // Check user's sharing settings
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('workout_sharing')
    .eq('user_id', session.user.id)
    .single();

  // If user hasn't opted in to sharing, prevent public/friends posts
  if (privacySettings?.workout_sharing === 'private' && payload.visibility !== 'private') {
    return NextResponse.json(
      { error: 'Please update privacy settings to share workouts' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('workout_posts')
    .insert({
      user_id: session.user.id,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
