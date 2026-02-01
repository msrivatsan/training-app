import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveDeload } from '@/lib/deload';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const programId = searchParams.get('programId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Query for active or upcoming deloads
    let query = supabase
      .from('deload_schedules')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['upcoming', 'notified', 'active'])
      .order('scheduled_week_start', { ascending: true })
      .limit(1);

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data: deloads, error } = await query;

    if (error) throw error;

    // Get the most relevant deload (active first, then upcoming)
    const deload = deloads && deloads.length > 0 ? getActiveDeload(deloads) || deloads[0] : null;

    return NextResponse.json({ deload });
  } catch (error) {
    console.error('Error fetching active deload:', error);
    return NextResponse.json({ error: 'Failed to fetch deload' }, { status: 500 });
  }
}
