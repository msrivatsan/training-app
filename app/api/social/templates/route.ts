import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CreateTemplatePayload } from '@/lib/types/social';

// GET community templates
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const sort = searchParams.get('sort') || 'rating'; // 'rating', 'uses', 'recent'
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('community_program_templates')
    .select(`
      *,
      creator:users!community_program_templates_creator_id_fkey(id, name, avatar)
    `)
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (difficulty) {
    query = query.eq('difficulty_level', difficulty);
  }

  // Apply sorting
  if (sort === 'rating') {
    query = query.order('rating_average', { ascending: false });
  } else if (sort === 'uses') {
    query = query.order('uses_count', { ascending: false });
  } else if (sort === 'recent') {
    query = query.order('created_at', { ascending: false });
  }

  const { data: templates, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user's ratings for these templates
  const templateIds = templates.map(t => t.id);
  const { data: userRatings } = await supabase
    .from('template_ratings')
    .select('template_id, rating')
    .eq('user_id', session.user.id)
    .in('template_id', templateIds);

  const ratingsMap = new Map(userRatings?.map(r => [r.template_id, r.rating]));

  // Enrich templates with user rating
  const enrichedTemplates = templates.map(template => ({
    ...template,
    creator_name: template.creator?.name,
    creator_avatar: template.creator?.avatar,
    user_rating: ratingsMap.get(template.id),
  }));

  return NextResponse.json(enrichedTemplates);
}

// POST create a new template
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload: CreateTemplatePayload = await request.json();

  // Verify program belongs to user
  const { data: program } = await supabase
    .from('programs')
    .select('id, user_id')
    .eq('id', payload.program_id)
    .single();

  if (!program || program.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Program not found or unauthorized' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('community_program_templates')
    .insert({
      creator_id: session.user.id,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
