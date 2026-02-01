import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST increment uses count when someone uses a template
export async function POST(
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

  // Increment uses count
  const { data, error } = await supabase.rpc('increment_template_uses', {
    template_id: params.id,
  });

  if (error) {
    // Fallback if RPC doesn't exist
    const { error: updateError } = await supabase
      .from('community_program_templates')
      .update({ uses_count: supabase.rpc('coalesce', ['uses_count', 0]) })
      .eq('id', params.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
