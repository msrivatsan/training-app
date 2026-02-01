import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// PUT - Accept/reject friend request
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

  const { status } = await request.json();

  if (!['accepted', 'rejected', 'blocked'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Update friendship status (only if user is the receiver)
  const { data, error } = await supabase
    .from('friendships')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('friend_id', session.user.id) // Must be the receiver
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE - Remove friend or cancel friend request
export async function DELETE(
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

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', params.id)
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
