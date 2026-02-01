import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET all friends and friend requests
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'accepted';

  // Get friendships where user is either sender or receiver
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select(`
      *,
      user:users!friendships_user_id_fkey(id, name, avatar),
      friend:users!friendships_friend_id_fkey(id, name, avatar)
    `)
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data to show the friend (not the current user)
  const friends = friendships.map((f: any) => {
    const isSender = f.user_id === session.user.id;
    return {
      ...f,
      friend_profile: isSender ? f.friend : f.user,
    };
  });

  return NextResponse.json(friends);
}

// POST new friend request
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { friend_id } = await request.json();

  if (!friend_id) {
    return NextResponse.json({ error: 'friend_id is required' }, { status: 400 });
  }

  // Check if user allows friend requests
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('allow_friend_requests')
    .eq('user_id', friend_id)
    .single();

  if (privacySettings && !privacySettings.allow_friend_requests) {
    return NextResponse.json({ error: 'User does not accept friend requests' }, { status: 403 });
  }

  // Create friend request
  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: session.user.id,
      friend_id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
