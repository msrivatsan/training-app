import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CreatePartnerProfilePayload } from '@/lib/types/social';

// GET user's partner profile
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('training_partner_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

// POST create partner profile
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: CreatePartnerProfilePayload = await request.json();

  // Check if user has enabled partner matching
  const { data: privacySettings } = await supabase
    .from('user_privacy_settings')
    .select('allow_partner_matching')
    .eq('user_id', session.user.id)
    .single();

  if (privacySettings && !privacySettings.allow_partner_matching) {
    return NextResponse.json(
      { error: 'Please enable partner matching in privacy settings' },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from('training_partner_profiles')
    .upsert(
      {
        user_id: session.user.id,
        ...payload,
        is_active: true,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT update partner profile
export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: CreatePartnerProfilePayload = await request.json();

  const { data, error } = await supabase
    .from('training_partner_profiles')
    .update(payload)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
