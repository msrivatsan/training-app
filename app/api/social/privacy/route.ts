import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UpdatePrivacySettingsPayload } from '@/lib/types/social';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_privacy_settings')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no settings exist, return defaults
  if (!data) {
    const defaults = {
      user_id: session.user.id,
      profile_visibility: 'private',
      workout_sharing: 'private',
      show_on_leaderboards: false,
      allow_friend_requests: true,
      allow_partner_matching: false,
      show_strength_scores: false,
      show_location: false,
    };
    return NextResponse.json(defaults);
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: UpdatePrivacySettingsPayload = await request.json();

  // Upsert privacy settings
  const { data, error } = await supabase
    .from('user_privacy_settings')
    .upsert(
      {
        user_id: session.user.id,
        ...payload,
        updated_at: new Date().toISOString(),
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
