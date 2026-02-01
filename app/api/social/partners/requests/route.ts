import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SendPartnerRequestPayload } from '@/lib/types/social';

// GET partner requests (sent and received)
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('partner_requests')
    .select(`
      *,
      sender:users!partner_requests_sender_id_fkey(id, name, avatar),
      receiver:users!partner_requests_receiver_id_fkey(id, name, avatar)
    `)
    .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST send partner request
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: SendPartnerRequestPayload = await request.json();

  const { data, error } = await supabase
    .from('partner_requests')
    .insert({
      sender_id: session.user.id,
      receiver_id: payload.receiver_id,
      message: payload.message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Partner request already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
